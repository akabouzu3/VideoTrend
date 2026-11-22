import { hourMs, type RankingCategory } from "../lib/ranking-model";

type CuratedPost = {
  id: string;
  account: string;
  category: RankingCategory;
  createdAt: string;
  title: string;
  description: string;
  thumbnailUrl: string;
} & (
  | { playback: "embed" }
  | { playback: "file"; videoUrl: string }
);

export type ManualVideo = CuratedPost & {
  kind: "manual";
  hours: number;
  duration: null;
};

const posts: CuratedPost[] = [
  {
    id: "2124041931110146552",
    account: "tva_sports",
    category: "sports",
    createdAt: "2026-11-21T07:27:13Z",
    title: "細川成也のホームラン",
    description: "中日ドラゴンズのファンフェスタで、細川成也が本塁打を放った場面。",
    thumbnailUrl: "https://pbs.twimg.com/amplify_video_thumb/2124040064363810816/img/tZAYvoRmLHM-_AeO.jpg",
    playback: "embed",
  },
  {
    id: "2095032306906153181",
    account: "Natuuri98",
    category: "animals",
    createdAt: "2026-09-02T06:13:20Z",
    title: "ごはんを待ちきれない保護子猫",
    description: "食事の用意に気づいた3匹の保護子猫が、勢いよく集まってくる様子。",
    thumbnailUrl: "https://pbs.twimg.com/amplify_video_thumb/2095032274010136576/img/YXYt_hOKoLgf3SR0.jpg",
    playback: "embed",
  },
];

const asOf = new Date(Math.max(...posts.map(({ createdAt }) => Date.parse(createdAt))));

export const manualCollection = {
  asOf: asOf.toISOString(),
  videos: posts.map((post): ManualVideo => ({
    ...post,
    kind: "manual",
    hours: (asOf.getTime() - Date.parse(post.createdAt)) / hourMs,
    duration: null,
  })),
};
