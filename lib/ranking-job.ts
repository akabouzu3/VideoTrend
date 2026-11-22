import "server-only";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { getDatabase } from "./db";
import { rankingPosts, rankingState, suppressedPosts } from "./db/schema";
import { categories, hourMs, normalizeSearch, rankingCategories, rankingPeriods } from "./ranking-model";
import { recentStart, videoMedia, type XBatch, type XClient } from "./x/client";

type RankingPost = typeof rankingPosts.$inferSelect;
const jobLock = 684_290_173;
const stateId = 1;

function rankingPost(post: XBatch["posts"][number], batch: XBatch): RankingPost | null {
  const media = videoMedia(post, batch);
  if (!media || post.possibly_sensitive || post.withheld) return null;
  const text = normalizeSearch(post.text);
  const category = rankingCategories.find((key) => categories[key].terms.some((term) => text.includes(term)));
  if (!category) return null;
  const metrics = post.public_metrics;
  const preview = media.preview_image_url;
  return {
    id: post.id,
    category,
    createdAt: new Date(post.created_at),
    count: metrics.like_count + metrics.retweet_count + metrics.reply_count + metrics.quote_count,
    durationMs: media.duration_ms ?? null,
    thumbnailUrl: preview?.startsWith("https://pbs.twimg.com/") ? preview : null,
    searchText: `${text} ${categories[category].label}`,
  };
}

function selectPosts(posts: Iterable<RankingPost>, now: Date, perWindow: number) {
  const ordered = [...posts].sort((a, b) =>
    b.count - a.count || b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id));
  let previousWindow = -1;
  return rankingPeriods.flatMap((window) => {
    const selected = ordered.filter(({ createdAt }) => {
      const age = (now.getTime() - createdAt.getTime()) / hourMs;
      return age > previousWindow && age >= 0 && age <= window;
    }).slice(0, perWindow);
    previousWindow = window;
    return selected;
  });
}

export async function refreshRankings(
  client: XClient,
  settings: { searchLimit: number; searchPages: number; trackedPerWindow: number },
  now = new Date(),
) {
  return getDatabase().transaction(async (tx) => {
    const [lock] = await tx.execute<{ locked: boolean }>(sql`select pg_try_advisory_xact_lock(${jobLock}) as locked`);
    if (!lock.locked) return { status: "busy" as const };

    await tx.insert(rankingState).values({ id: stateId }).onConflictDoNothing();
    const [previous] = await tx.select().from(rankingState).where(eq(rankingState.id, stateId));
    const existing = await tx.select({ id: rankingPosts.id }).from(rankingPosts);
    const [lookup, search] = await Promise.allSettled([
      client.lookup(existing.map(({ id }) => id)),
      client.search(settings.searchLimit, recentStart(now, previous.updatedAt), settings.searchPages),
    ]);
    const verified = new Map<string, RankingPost>();
    if (lookup.status === "fulfilled") {
      for (const post of lookup.value.posts) {
        const row = rankingPost(post, lookup.value);
        if (row) verified.set(row.id, row);
      }
    }

    if (lookup.status === "rejected" || search.status === "rejected") {
      // A confirmed removal takes effect even when the discovery request failed.
      const removed = lookup.status === "fulfilled" ? existing.filter(({ id }) => !verified.has(id)) : [];
      if (removed.length) {
        await tx.delete(rankingPosts).where(inArray(rankingPosts.id, removed.map(({ id }) => id)));
      }
      await tx.update(rankingState).set({
        lastAttemptAt: now,
        ...(removed.length ? { revision: randomUUID() } : {}),
      }).where(eq(rankingState.id, stateId));
      const cause = lookup.status === "rejected" ? lookup.reason : search.status === "rejected" ? search.reason : undefined;
      return { status: "failed" as const, removed: removed.length, cause };
    }

    const previouslyListed = new Set(existing.map(({ id }) => id));
    for (const post of search.value.posts) {
      if (previouslyListed.has(post.id)) continue;
      const row = rankingPost(post, search.value);
      if (row) verified.set(row.id, row);
    }
    if (verified.size) {
      const suppressed = await tx.select({ id: suppressedPosts.id }).from(suppressedPosts)
        .where(inArray(suppressedPosts.id, [...verified.keys()]));
      for (const { id } of suppressed) verified.delete(id);
    }

    const next = selectPosts(verified.values(), now, settings.trackedPerWindow);
    await tx.delete(rankingPosts);
    if (next.length) await tx.insert(rankingPosts).values(next);
    await tx.update(rankingState).set({
      revision: randomUUID(), updatedAt: now, lastAttemptAt: now,
    }).where(eq(rankingState.id, stateId));
    return { status: "updated" as const, published: next.length, searchHasMore: search.value.hasMore };
  });
}

export async function suppressPost(id: string) {
  await getDatabase().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${jobLock})`);
    await tx.insert(suppressedPosts).values({ id }).onConflictDoNothing();
    const removed = await tx.delete(rankingPosts).where(eq(rankingPosts.id, id)).returning({ id: rankingPosts.id });
    if (removed.length) await tx.update(rankingState).set({ revision: randomUUID() }).where(eq(rankingState.id, stateId));
  });
}
