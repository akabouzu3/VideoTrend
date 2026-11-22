import { suppressPost } from "../../../../lib/ranking-job";
import { postIdPattern } from "../../../../lib/ranking-model";
import { invalidateRankingCache, usesLiveRanking } from "../../../../lib/rankings";
import { isCronAuthorized } from "../../../../lib/server/authorization";
import { reportServerError } from "../../../../lib/server/report-error";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) return new Response(null, { status: 401 });
  if (!usesLiveRanking()) return new Response(null, { status: 404 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !postIdPattern.test(id)) return new Response(null, { status: 400 });

  try {
    await suppressPost(id);
    invalidateRankingCache();
    return new Response(null, { status: 204 });
  } catch (error) {
    await reportServerError("Ranking removal", error);
    return new Response(null, { status: 503 });
  }
}
