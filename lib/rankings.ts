import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { getDatabase } from "./db";
import { rankingPosts, rankingState } from "./db/schema";
import { normalizeSearch, type LiveRanking } from "./ranking-model";

const rankingTag = "published-x-ranking";

const getPublishedRanking = unstable_cache(async (revision: string): Promise<LiveRanking | null> => {
  const rows = await getDatabase().select({
    updatedAt: rankingState.updatedAt,
    post: {
      id: rankingPosts.id,
      category: rankingPosts.category,
      createdAt: rankingPosts.createdAt,
      count: rankingPosts.count,
      durationMs: rankingPosts.durationMs,
      thumbnailUrl: rankingPosts.thumbnailUrl,
    },
  }).from(rankingState)
    .leftJoin(rankingPosts, sql`true`)
    .where(eq(rankingState.revision, revision));
  if (!rows.length) return null;
  return {
    updatedAt: rows[0].updatedAt?.toISOString() ?? null,
    videos: rows.flatMap(({ post }) => post ? [{ ...post, createdAt: post.createdAt.toISOString() }] : []),
  };
}, [rankingTag], { revalidate: 300, tags: [rankingTag] });

export function invalidateRankingCache() {
  revalidateTag(rankingTag, { expire: 0 });
}

export function usesLiveRanking() {
  return process.env.RANKING_SOURCE === "x";
}

export async function getLiveRanking(): Promise<LiveRanking> {
  // Read the revision on each request so a removed post cannot be read from an old cache key.
  for (let attempt = 0; attempt < 2; attempt++) {
    const [state] = await getDatabase().select({ revision: rankingState.revision })
      .from(rankingState).where(eq(rankingState.id, 1));
    if (!state) return { updatedAt: null, videos: [] };
    const ranking = await getPublishedRanking(state.revision);
    if (ranking) return ranking;
  }
  throw new Error("Ranking updated while being read");
}

export async function findMatchingPostIds(query: string) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const matches = await getDatabase().select({ id: rankingPosts.id }).from(rankingPosts).where(
    and(...terms.map((term) => sql`strpos(${rankingPosts.searchText}, ${term}) > 0`)),
  );
  return matches.map(({ id }) => id);
}
