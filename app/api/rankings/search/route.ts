import { normalizeSearch } from "../../../../lib/ranking-model";
import { findMatchingPostIds, usesLiveRanking } from "../../../../lib/rankings";
import { reportServerError } from "../../../../lib/server/report-error";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  if (!usesLiveRanking()) return new Response(null, { status: 404, headers });
  const query = normalizeSearch(new URL(request.url).searchParams.get("q") ?? "");
  if (!query || query.length > 100) return new Response(null, { status: 400, headers });

  try {
    return Response.json({ ids: await findMatchingPostIds(query) }, { headers });
  } catch (error) {
    await reportServerError("Ranking keyword search", error);
    return new Response(null, { status: 503, headers });
  }
}
