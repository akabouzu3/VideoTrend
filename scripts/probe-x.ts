import { loadEnvConfig } from "@next/env";
import { createXClient, recentStart, videoMedia } from "../lib/x/client";
import { xSearchLimit } from "../lib/x/settings";

loadEnvConfig(process.cwd());

async function probe() {
  const token = process.env.X_BEARER_TOKEN?.trim();
  if (!token || process.argv[2] !== "--confirm-paid") {
    console.error("X_BEARER_TOKEN と --confirm-paid が必要です。X APIの読み取りは従量課金です。");
    process.exitCode = 1;
    return;
  }
  const limit = xSearchLimit.parse(process.argv[3] ?? "10");
  const batch = await createXClient(token).search(limit, recentStart(new Date()));
  const media = batch.posts.flatMap((post) => videoMedia(post, batch) ?? []);
  console.log(JSON.stringify({
    requestedPostLimit: limit,
    returnedPosts: batch.posts.length,
    searchHasMore: batch.hasMore,
    postsWithVideo: media.length,
    videosWithViewCount: media.filter((item) => item.public_metrics?.view_count !== undefined).length,
  }, null, 2));
}

probe().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "X API probe failed");
  process.exitCode = 1;
});
