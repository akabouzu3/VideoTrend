import { categories, hourMs, normalizeSearch, type Category, type LiveRanking, type LiveVideo } from "../lib/ranking-model";
import type { ManualVideo } from "./manual-posts";

export { categories };
export type { Category, Period } from "../lib/ranking-model";

type SampleVideo = {
  kind?: "sample";
  id: string;
  tile: number;
  category: Exclude<Category, "all">;
  title: string;
  search: string;
  description: string;
  duration: string;
  hours: number;
  views: number;
};

type PublishedVideo = LiveVideo & {
  kind: "x";
  title: string;
  duration: string | null;
  hours: number;
};

export type Video = SampleVideo | PublishedVideo | ManualVideo;

export const videos: SampleVideo[] = [
  {
    id: "cat",
    tile: 0,
    category: "animals",
    title: "朝から距離感ゼロの茶トラ",
    search: "茶トラ 猫",
    description: "日なたのソファでくつろいでいた茶トラが、カメラを見つけてぐいっと近づいてきます。",
    duration: "0:18",
    hours: 3,
    views: 1280000,
  },
  {
    id: "rain",
    tile: 1,
    category: "daily",
    title: "雨上がりの渋谷、ネオンが路面に映る夜",
    search: "渋谷 雨 夜",
    description: "傘が行き交う交差点。濡れた路面に映るネオンが、いつもの渋谷を別の街のように見せてくれます。",
    duration: "0:32",
    hours: 6,
    views: 864000,
  },
  {
    id: "omurice",
    tile: 2,
    category: "food",
    title: "洋食屋さんのとろとろオムライス",
    search: "オムライス 洋食",
    description: "ふわっと焼き上げた卵に、つやつやのデミグラスソース。洋食屋の定番を仕上げるひとコマです。",
    duration: "0:45",
    hours: 9,
    views: 642000,
  },
  {
    id: "skate",
    tile: 3,
    category: "sports",
    title: "夕焼けのスケートパークで決まった一発",
    search: "スケボー トリック",
    description: "日が沈む直前のスケートパークで、スケーターがボードを空中で回します。",
    duration: "0:24",
    hours: 11,
    views: 516000,
  },
  {
    id: "stage",
    tile: 4,
    category: "music",
    title: "小さなライブハウスに響くハーモニー",
    search: "バンド ライブ演奏",
    description: "青と紫の照明の下で、ふたりの歌声が重なるライブの一場面です。",
    duration: "0:59",
    hours: 14,
    views: 398000,
  },
  {
    id: "shiba",
    tile: 5,
    category: "animals",
    title: "水の冷たさも気にせず走る柴犬",
    search: "柴犬 川遊び",
    description: "木漏れ日が差す浅い川を、柴犬が水しぶきを上げながら駆け抜けます。",
    duration: "0:22",
    hours: 18,
    views: 306000,
  },
  {
    id: "train",
    tile: 6,
    category: "daily",
    title: "海を横目に走るローカル線",
    search: "ローカル線 海 車窓",
    description: "青い海が見える斜面を、緑色の列車がゆっくり通り過ぎます。",
    duration: "0:38",
    hours: 34,
    views: 1030000,
  },
  {
    id: "matcha",
    tile: 7,
    category: "food",
    title: "抹茶ラテを混ぜるときのきれいな渦",
    search: "抹茶ラテ 作り方",
    description: "氷のすき間をめぐる抹茶とミルクを、真上から眺めます。",
    duration: "0:16",
    hours: 59,
    views: 734000,
  },
  {
    id: "basketball",
    tile: 8,
    category: "sports",
    title: "日が暮れるまで続いたストリートバスケ",
    search: "ストリートバスケ レイアップ",
    description: "空が紫色に変わるころ、屋外コートでボールがリングに向かって飛びます。",
    duration: "0:28",
    hours: 107,
    views: 1810000,
  },
];

export const videosById = new Map(videos.map((video) => [video.id, video]));

export function publishedVideos(ranking: LiveRanking): PublishedVideo[] {
  if (!ranking.updatedAt) return [];
  const asOf = Date.parse(ranking.updatedAt);
  return ranking.videos.map((video) => {
    const seconds = video.durationMs == null ? null : Math.ceil(video.durationMs / 1000);
    const duration = seconds == null ? null : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    return {
      ...video,
      kind: "x",
      title: `${categories[video.category].label}の動画`,
      duration,
      hours: (asOf - Date.parse(video.createdAt)) / hourMs,
    };
  });
}

export function score(video: Exclude<Video, ManualVideo>) {
  return video.kind === "x" ? video.count : video.views;
}

export function xSearch(topic = "") {
  const url = new URL("https://x.com/search");
  url.searchParams.set("q", [topic.trim(), "filter:videos", "lang:ja"].filter(Boolean).join(" "));
  url.searchParams.set("f", "top");
  return url.href;
}

export function filterVideos(source: Video[], category: Category, query: string, matchedPosts?: ReadonlySet<string>) {
  const terms = normalizeSearch(query).split(/\s+/);
  return source
    .map((video, index) => ({ video, rank: index + 1 }))
    .filter(({ video }) => {
      if (category !== "all" && category !== video.category) return false;
      if (video.kind === "x") return terms[0] === "" || Boolean(matchedPosts?.has(video.id));
      const text = normalizeSearch([
        video.title, video.kind === "manual" ? video.account : video.search,
        video.description, categories[video.category].label,
      ].join(" "));
      return terms.every((term) => text.includes(term));
    });
}
