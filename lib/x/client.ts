import { z } from "zod";
import { categoryQuery, minuteMs, postIdPattern, rankingCategories } from "../ranking-model";

const postId = z.string().regex(postIdPattern);
const metrics = z.object({
  like_count: z.int().nonnegative(),
  retweet_count: z.int().nonnegative(),
  reply_count: z.int().nonnegative(),
  quote_count: z.int().nonnegative(),
});
const post = z.object({
  id: postId,
  text: z.string(),
  created_at: z.iso.datetime({ offset: true }),
  public_metrics: metrics,
  possibly_sensitive: z.boolean().optional(),
  withheld: z.object({}).optional(),
  attachments: z.object({ media_keys: z.array(z.string()).optional() }).optional(),
});
const media = z.object({
  media_key: z.string(),
  type: z.string(),
  preview_image_url: z.string().optional(),
  duration_ms: z.int().nonnegative().max(2_147_483_647).optional(),
  public_metrics: z.object({ view_count: z.int().nonnegative().optional() }).optional(),
});
const apiResponse = z.object({
  data: z.array(post).default([]),
  includes: z.object({ media: z.array(media).default([]) }).optional(),
  errors: z.array(z.object({
    type: z.string(),
    resource_id: z.string().optional(),
    value: z.string().optional(),
  })).default([]),
  meta: z.object({
    result_count: z.int().nonnegative(),
    next_token: z.string().min(1).optional(),
  }).optional(),
});

export type XPost = z.infer<typeof post>;
type XMedia = z.infer<typeof media>;
export type XBatch = { posts: XPost[]; media: ReadonlyMap<string, XMedia> };
export type XClient = ReturnType<typeof createXClient>;

const fields = {
  "tweet.fields": "created_at,public_metrics,possibly_sensitive,withheld,attachments",
  expansions: "attachments.media_keys",
  "media.fields": "type,duration_ms,preview_image_url,public_metrics",
};
const query = `(${rankingCategories.map(categoryQuery).join(" OR ")}) lang:ja has:videos -is:retweet -is:reply`;
const unavailableTypes = new Set(["resource-not-found", "not-authorized-for-resource", "resource-unauthorized"]);

export function createXClient(token: string, fetcher: typeof fetch = fetch) {
  async function get(path: string, params: Record<string, string>) {
    const url = new URL(path, "https://api.x.com");
    url.search = new URLSearchParams({ ...fields, ...params }).toString();
    const response = await fetcher(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`X API request failed (HTTP ${response.status})`);
    const parsed = apiResponse.safeParse(await response.json());
    if (!parsed.success) throw new Error("Unexpected X API response");
    return parsed.data;
  }

  function batch(result: z.infer<typeof apiResponse>): XBatch {
    const media = new Map(result.includes?.media.map((item) => [item.media_key, item]));
    const missingMedia = result.data.some((post) =>
      !post.possibly_sensitive && !post.withheld &&
      post.attachments?.media_keys?.some((key) => !media.has(key)),
    );
    if (missingMedia) throw new Error("Incomplete X media response");
    return { posts: result.data, media };
  }

  return {
    async search(limit: number, start: Date, maxPages = 1): Promise<XBatch & { hasMore: boolean }> {
      const posts = new Map<string, XPost>();
      const media = new Map<string, XMedia>();
      const seenTokens = new Set<string>();
      let nextToken: string | undefined;

      for (let page = 0; page < maxPages; page++) {
        const result = await get("/2/tweets/search/recent", {
          query,
          max_results: String(limit),
          start_time: start.toISOString().replace(/\.\d{3}Z$/, "Z"),
          sort_order: "recency",
          ...(nextToken ? { next_token: nextToken } : {}),
        });
        if (result.errors.length || result.data.length !== result.meta?.result_count || result.data.length > limit) {
          throw new Error("Incomplete X search response");
        }
        const batchPage = batch(result);
        for (const post of batchPage.posts) posts.set(post.id, post);
        for (const [key, item] of batchPage.media) media.set(key, item);

        nextToken = result.meta?.next_token;
        if (!nextToken) break;
        if (seenTokens.has(nextToken)) throw new Error("Repeated X search pagination token");
        seenTokens.add(nextToken);
      }

      return { posts: [...posts.values()], media, hasMore: Boolean(nextToken) };
    },
    async lookup(ids: string[]): Promise<XBatch> {
      if (!ids.length) return { posts: [], media: new Map() };
      const result = await get("/2/tweets", { ids: ids.join(",") });
      const requested = new Set(ids);
      const found = new Set(result.data.map(({ id }) => id));
      for (const error of result.errors) {
        const id = error.resource_id ?? error.value;
        const type = error.type.slice(error.type.lastIndexOf("/") + 1);
        if (!id || !requested.has(id) || found.has(id) || !unavailableTypes.has(type)) {
          throw new Error("X lookup reported an unverified error");
        }
        found.add(id);
      }
      if (found.size !== requested.size || [...found].some((id) => !requested.has(id))) {
        throw new Error("Incomplete X lookup response");
      }
      return batch(result);
    },
  };
}

export function recentStart(now: Date, lastUpdate?: Date | null) {
  const earliest = now.getTime() - 7 * 24 * 60 * minuteMs + 5 * minuteMs;
  return new Date(Math.max(earliest, (lastUpdate?.getTime() ?? 0) - 5 * minuteMs));
}

export function videoMedia(post: XPost, batch: XBatch) {
  return post.attachments?.media_keys?.map((key) => batch.media.get(key)).find((item) => item?.type === "video");
}
