import { connection } from "next/server";
import { getLiveRanking, usesLiveRanking } from "../lib/rankings";
import { reportServerError } from "../lib/server/report-error";
import { manualCollection } from "./manual-posts";
import { VideoTrend } from "./video-trend";

export default async function Home() {
  await connection();
  if (process.env.RANKING_SOURCE === "manual") return <VideoTrend manual={manualCollection} />;
  if (!usesLiveRanking()) return <VideoTrend />;

  const live = await getLiveRanking().catch(async (error: unknown) => {
    await reportServerError("Ranking read", error);
    return null;
  });
  return <VideoTrend live={live ?? { updatedAt: null, videos: [] }} unavailable={live === null} />;
}
