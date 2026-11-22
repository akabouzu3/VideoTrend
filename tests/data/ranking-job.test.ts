import assert from "node:assert/strict";
import { test } from "node:test";
import { getDatabase } from "../../lib/db";
import { rankingPosts, rankingState, suppressedPosts } from "../../lib/db/schema";
import { refreshRankings, suppressPost } from "../../lib/ranking-job";
import { hourMs } from "../../lib/ranking-model";
import { createXClient } from "../../lib/x/client";

const settings = { searchLimit: 20, trackedPerWindow: 10 };
const now = new Date();
const deletedId = "1890000000000000001";
const keptId = "1890000000000000002";
const suppressedId = "1890000000000000003";
const newId = "1890000000000000004";
const sensitiveId = "1890000000000000005";

function fixturePost(id: string, age: number, likes: number, possiblySensitive = false) {
  return {
    id,
    text: "ねこの昼寝　猫の動画",
    created_at: new Date(now.getTime() - age * hourMs).toISOString(),
    public_metrics: { like_count: likes, retweet_count: 3, reply_count: 2, quote_count: 1 },
    attachments: { media_keys: [`7_${id}`] },
    possibly_sensitive: possiblySensitive,
  };
}

function fixtureBatch(data: ReturnType<typeof fixturePost>[], errors: object[] = []) {
  return Response.json({
    data,
    includes: { media: data.map((item) => ({
      media_key: item.attachments.media_keys[0], type: "video", duration_ms: 30_000,
    })) },
    meta: { result_count: data.length },
    errors,
  });
}

function fakeX(fetcher: (url: URL) => Response | Promise<Response>) {
  return createXClient("fixture-token", async (input, options) => {
    const url = new URL(input.toString());
    assert.equal(url.origin, "https://api.x.com");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer fixture-token");
    return fetcher(url);
  });
}

test("refreshes and preserves rankings atomically across retries and removals", { timeout: 15_000 }, async () => {
  const url = new URL(process.env.TEST_DATABASE_URL ?? "postgresql://localhost/invalid");
  assert.equal(url.pathname, "/videotrend_test", "Use the dedicated videotrend_test database");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname), "Use a local test database");
  process.env.DATABASE_URL = url.href;
  const db = getDatabase();
  const old = fixturePost(deletedId, 1, 50);
  const kept = fixturePost(keptId, 30, 25);

  try {
    await db.delete(rankingPosts);
    await db.delete(rankingState);
    await db.delete(suppressedPosts);

    const initial = await refreshRankings(fakeX((request) => {
      assert.equal(request.pathname, "/2/tweets/search/recent");
      assert.equal(request.searchParams.get("max_results"), "20");
      assert.match(request.searchParams.get("query") ?? "", /lang:ja has:videos/);
      return fixtureBatch([old, kept, fixturePost(sensitiveId, 4, 100, true)]);
    }), settings, now);
    assert.deepEqual(initial, { status: "updated", published: 2 });
    const [first] = await db.select().from(rankingState);
    const before = await db.select().from(rankingPosts);
    assert.equal(before.find((row) => row.id === deletedId)?.count, 56);

    const incomplete = await refreshRankings(fakeX((request) => request.pathname === "/2/tweets"
      ? fixtureBatch([kept])
      : fixtureBatch([])), settings, new Date(now.getTime() + 1_000));
    assert.equal(incomplete.status, "failed");
    assert.equal((await db.select().from(rankingPosts)).length, 2);
    assert.equal((await db.select().from(rankingState))[0].revision, first.revision);

    let releaseSearch!: () => void;
    let enteredSearch!: () => void;
    const waiting = new Promise<void>((resolve) => { releaseSearch = resolve; });
    const entered = new Promise<void>((resolve) => { enteredSearch = resolve; });
    const failingRefresh = refreshRankings(fakeX(async (request) => {
      if (request.pathname === "/2/tweets") {
        return fixtureBatch([kept], [{
          type: "https://api.x.com/2/problems/resource-not-found", resource_id: deletedId,
        }]);
      }
      enteredSearch();
      await waiting;
      return new Response(null, { status: 429 });
    }), settings, new Date(now.getTime() + 2_000));

    await entered;
    try {
      const busy = await refreshRankings(fakeX(() => assert.fail("A concurrent refresh must not call X")), settings);
      assert.deepEqual(busy, { status: "busy" });
    } finally {
      releaseSearch();
    }
    const removed = await failingRefresh;
    assert.equal(removed.status, "failed");
    assert.equal(removed.status === "failed" && removed.removed, 1);
    const [afterRemoval] = await db.select().from(rankingState);
    assert.notEqual(afterRemoval.revision, first.revision);
    assert.equal(afterRemoval.updatedAt?.getTime(), first.updatedAt?.getTime());

    await suppressPost(suppressedId);
    const retry = await refreshRankings(fakeX((request) => {
      if (request.pathname === "/2/tweets") {
        assert.equal(request.searchParams.get("ids"), keptId);
        return fixtureBatch([kept]);
      }
      return fixtureBatch([kept, fixturePost(suppressedId, 1, 100), fixturePost(newId, 2, 12)]);
    }), settings, new Date(now.getTime() + 3_000));
    assert.equal(retry.status, "updated");
    const afterRetry = await db.select().from(rankingPosts);
    assert.deepEqual(afterRetry.map(({ id }) => id).sort(), [keptId, newId]);
    assert.notEqual((await db.select().from(rankingState))[0].revision, afterRemoval.revision);
  } finally {
    await db.$client.end();
  }
});
