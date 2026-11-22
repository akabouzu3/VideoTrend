import { refreshRankings } from "../../../../lib/ranking-job";
import { invalidateRankingCache, usesLiveRanking } from "../../../../lib/rankings";
import { isCronAuthorized } from "../../../../lib/server/authorization";
import { reportServerError } from "../../../../lib/server/report-error";
import { createXClient } from "../../../../lib/x/client";
import { readXSettings } from "../../../../lib/x/settings";

export const maxDuration = 60;

export async function GET(request: Request) {
  if (!usesLiveRanking()) return new Response(null, { status: 204 });
  if (!isCronAuthorized(request)) return new Response(null, { status: 401 });

  try {
    const settings = readXSettings();
    const result = await refreshRankings(createXClient(settings.token), settings);
    if (result.status === "updated" || (result.status === "failed" && result.removed > 0)) {
      invalidateRankingCache();
    }
    if (result.status === "failed") {
      await reportServerError("Ranking refresh", result.cause);
      return Response.json({ status: "failed", removed: result.removed }, { status: 503 });
    }
    return Response.json(result);
  } catch (error) {
    await reportServerError("Ranking refresh", error);
    return Response.json({ status: "failed" }, { status: 503 });
  }
}
