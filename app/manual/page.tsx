import type { Metadata } from "next";
import { manualCollection } from "../manual-posts";
import { VideoTrend } from "../video-trend";

export const metadata: Metadata = {
  title: "手選び動画 | VideoTrend",
  description: "Xの動画付き投稿をジャンルやキーワードから探せる手選び動画集。",
};

export default function ManualPage() {
  return <VideoTrend manual={manualCollection} />;
}
