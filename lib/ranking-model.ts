export const rankingCategories = ["animals", "daily", "food", "sports", "music"] as const;
export const categories = {
  all: { label: "すべて", terms: [] },
  animals: { label: "動物", terms: ["猫", "犬", "動物"] },
  daily: { label: "日常・風景", terms: ["風景", "日常", "街歩き"] },
  food: { label: "グルメ", terms: ["グルメ", "料理", "レシピ"] },
  sports: { label: "スポーツ", terms: ["スポーツ", "スケボー", "バスケ"] },
  music: { label: "音楽", terms: ["音楽", "ライブ", "弾き語り"] },
} as const;
export const rankingPeriods = [24, 72, 168] as const;
export const hourMs = 3_600_000;
export const minuteMs = 60_000;
export const postIdPattern = /^[1-9]\d{0,19}$/;

export type RankingCategory = typeof rankingCategories[number];
export type Category = keyof typeof categories;
export type Period = typeof rankingPeriods[number];

export type LiveVideo = {
  id: string;
  category: RankingCategory;
  createdAt: string;
  count: number;
  durationMs: number | null;
};

export type LiveRanking = {
  updatedAt: string | null;
  videos: LiveVideo[];
};

export function normalizeSearch(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ja");
}

export function categoryQuery(category: Category) {
  const terms = categories[category].terms;
  return terms.length ? `(${terms.join(" OR ")})` : "";
}

export function postUrl(id: string, account?: string) {
  const path = account ? encodeURIComponent(account) : "i/web";
  return `https://x.com/${path}/status/${id}`;
}
