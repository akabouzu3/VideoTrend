"use strict";

const icons = {
  triangle: '<path d="M8 4.5 20 12 8 19.5Z" fill="currentColor"/>',
  trend: '<path d="m3 17 6-6 4 4 7-8"/><path d="M14 7h6v6"/>',
  bookmark: '<path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4-6 4z"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4 4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  eye: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.6"/>',
  external: '<path d="M13 5h6v6m0-6-8 8"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
};

const categories = {
  all: { label: "すべて", query: "" },
  animals: { label: "動物", query: "(猫 OR 犬 OR 動物)" },
  daily: { label: "日常・風景", query: "(風景 OR 日常 OR 街歩き)" },
  food: { label: "グルメ", query: "(グルメ OR 料理 OR レシピ)" },
  sports: { label: "スポーツ", query: "(スポーツ OR スケボー OR バスケ)" },
  music: { label: "音楽", query: "(音楽 OR ライブ OR 弾き語り)" },
};

const videos = [
  { id: "cat", tile: 0, category: "animals", title: "朝から距離感ゼロの茶トラ", search: "茶トラ 猫", description: "日なたのソファでくつろいでいた茶トラが、カメラを見つけてぐいっと近づいてきます。", duration: "0:18", hours: 3, views: 1280000 },
  { id: "rain", tile: 1, category: "daily", title: "雨上がりの渋谷、ネオンが路面に映る夜", search: "渋谷 雨 夜", description: "傘が行き交う交差点。濡れた路面に映るネオンが、いつもの渋谷を別の街のように見せてくれます。", duration: "0:32", hours: 6, views: 864000 },
  { id: "omurice", tile: 2, category: "food", title: "洋食屋さんのとろとろオムライス", search: "オムライス 洋食", description: "ふわっと焼き上げた卵に、つやつやのデミグラスソース。洋食屋の定番を仕上げるひとコマです。", duration: "0:45", hours: 9, views: 642000 },
  { id: "skate", tile: 3, category: "sports", title: "夕焼けのスケートパークで決まった一発", search: "スケボー トリック", description: "日が沈む直前のスケートパークで、スケーターがボードを空中で回します。", duration: "0:24", hours: 11, views: 516000 },
  { id: "stage", tile: 4, category: "music", title: "小さなライブハウスに響くハーモニー", search: "バンド ライブ演奏", description: "青と紫の照明の下で、ふたりの歌声が重なるライブの一場面です。", duration: "0:59", hours: 14, views: 398000 },
  { id: "shiba", tile: 5, category: "animals", title: "水の冷たさも気にせず走る柴犬", search: "柴犬 川遊び", description: "木漏れ日が差す浅い川を、柴犬が水しぶきを上げながら駆け抜けます。", duration: "0:22", hours: 18, views: 306000 },
  { id: "train", tile: 6, category: "daily", title: "海を横目に走るローカル線", search: "ローカル線 海 車窓", description: "青い海が見える斜面を、緑色の列車がゆっくり通り過ぎます。", duration: "0:38", hours: 34, views: 1030000 },
  { id: "matcha", tile: 7, category: "food", title: "抹茶ラテを混ぜるときのきれいな渦", search: "抹茶ラテ 作り方", description: "氷のすき間をめぐる抹茶とミルクを、真上から眺めます。", duration: "0:16", hours: 59, views: 734000 },
  { id: "basketball", tile: 8, category: "sports", title: "日が暮れるまで続いたストリートバスケ", search: "ストリートバスケ レイアップ", description: "空が紫色に変わるころ、屋外コートでボールがリングに向かって飛びます。", duration: "0:28", hours: 107, views: 1810000 },
];

const storedKey = "videotrend-bookmarks";
const byId = (id) => document.getElementById(id);
const viewsFormat = new Intl.NumberFormat("ja-JP", { notation: "compact", maximumFractionDigits: 1 });
const search = byId("search");
const dialog = byId("detail");
const cards = byId("cards");
const state = { view: "rank", period: 24, category: "all", query: "", saved: readBookmarks() };

function readBookmarks() {
  try {
    const stored = JSON.parse(localStorage.getItem(storedKey) ?? "[]");
    return new Set(Array.isArray(stored) ? stored.filter((id) => videos.some((video) => video.id === id)) : []);
  } catch {
    return new Set();
  }
}

function addIcons(root = document) {
  for (const element of root.querySelectorAll("[data-icon]")) {
    element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[element.dataset.icon]}</svg>`;
  }
}

function xSearch(topic = "") {
  const url = new URL("https://x.com/search");
  url.searchParams.set("q", [topic.trim(), "filter:videos", "lang:ja"].filter(Boolean).join(" "));
  url.searchParams.set("f", "top");
  return url.href;
}

function setThumbnail(element, video) {
  element.style.setProperty("--x", `${(video.tile % 3) * 50}%`);
  element.style.setProperty("--y", `${Math.floor(video.tile / 3) * 50}%`);
}

function showDetail(video) {
  setThumbnail(byId("detail-image"), video);
  byId("detail-title").textContent = video.title;
  byId("detail-category").textContent = categories[video.category].label;
  byId("detail-description").textContent = video.description;
  byId("detail-link").href = xSearch(video.search);
  dialog.showModal();
}

function normalize(text) {
  return text.normalize("NFKC").trim().toLocaleLowerCase("ja");
}

function matchesFilters(video) {
  if (state.category !== "all" && state.category !== video.category) return false;
  const terms = normalize(state.query).split(/\s+/);
  const text = normalize([video.title, video.search, video.description, categories[video.category].label].join(" "));
  return terms.every((term) => text.includes(term));
}

function getResults() {
  const source = state.view === "saved"
    ? [...state.saved].reverse().map((id) => videos.find((video) => video.id === id))
    : videos.filter((video) => video.hours <= state.period).sort((a, b) => b.views - a.views);
  return source.map((video, index) => ({ video, rank: index + 1 })).filter(({ video }) => matchesFilters(video));
}

function updateSavedCount() {
  const count = byId("saved-count");
  count.textContent = state.saved.size;
  count.hidden = state.saved.size === 0;
}

function updateBookmarkButton(button, video) {
  const saved = state.saved.has(video.id);
  button.setAttribute("aria-pressed", saved);
  button.setAttribute("aria-label", `${video.title}：${saved ? "保存を解除" : "保存"}`);
  button.title = saved ? "保存を解除" : "保存";
}

function toggleBookmark(video, button) {
  if (state.saved.has(video.id)) state.saved.delete(video.id);
  else state.saved.add(video.id);
  try {
    localStorage.setItem(storedKey, JSON.stringify([...state.saved]));
  } catch {
    // The current tab can still keep bookmarks while storage is unavailable.
  }
  updateSavedCount();
  if (state.view === "saved") {
    const next = button.closest(".card").nextElementSibling ?? button.closest(".card").previousElementSibling;
    const nextId = next?.dataset.id;
    render();
    const nextCard = [...cards.children].find((card) => card.dataset.id === nextId);
    (nextCard?.querySelector(".save-button") ?? byId("empty-action")).focus();
  } else {
    updateBookmarkButton(button, video);
  }
}

function buildCard(video, rank) {
  const card = byId("video-card").content.cloneNode(true);
  card.querySelector(".card").dataset.id = video.id;
  const thumbnail = card.querySelector(".thumb");
  setThumbnail(thumbnail, video);
  thumbnail.setAttribute("aria-label", `${video.title}の詳細を見る`);
  const rankBadge = card.querySelector(".rank-badge");
  rankBadge.textContent = `#${rank}`;
  rankBadge.dataset.rank = rank;
  rankBadge.hidden = state.view === "saved";
  card.querySelector(".duration").textContent = video.duration;
  card.querySelector(".category-tag").textContent = categories[video.category].label;
  card.querySelector(".title-button").textContent = video.title;
  card.querySelector(".views > span:last-child").textContent = `${viewsFormat.format(video.views)}回再生`;
  card.querySelector(".posted").textContent = video.hours < 24
    ? `${video.hours}時間前`
    : `${Math.floor(video.hours / 24)}日前`;
  for (const button of card.querySelectorAll(".open-detail")) {
    button.addEventListener("click", () => showDetail(video));
  }
  const bookmark = card.querySelector(".save-button");
  updateBookmarkButton(bookmark, video);
  bookmark.addEventListener("click", () => toggleBookmark(video, bookmark));
  addIcons(card);
  return card;
}

function updateControls() {
  const savedView = state.view === "saved";
  byId("ranking-title").textContent = savedView ? "保存済みの動画" : "動画ランキング";
  byId("section-description").textContent = savedView ? "このブラウザで保存した動画を確認できます。" : "期間とジャンルで、気になる動画を探せます。";
  byId("periods").hidden = savedView;
  byId("heading-icon").dataset.icon = savedView ? "bookmark" : "trend";
  addIcons(byId("heading-icon").parentElement);
  for (const button of document.querySelectorAll("[data-view]")) {
    const active = button.dataset.view === state.view;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  for (const button of document.querySelectorAll("[data-period]")) {
    button.setAttribute("aria-pressed", Number(button.dataset.period) === state.period);
  }
  for (const button of byId("categories").children) {
    button.setAttribute("aria-pressed", state.category === button.dataset.category);
  }
}

function render() {
  updateControls();
  updateSavedCount();
  const results = getResults();
  cards.replaceChildren(...results.map(({ video, rank }) => buildCard(video, rank)));
  byId("results").textContent = `${results.length} 件の動画`;
  byId("empty").hidden = results.length > 0;
  const noBookmarks = state.view === "saved" && state.saved.size === 0;
  byId("empty-title").textContent = noBookmarks ? "保存済みの動画はまだありません" : "条件に合う動画がありません";
  byId("empty-action").textContent = noBookmarks ? "ランキングを見る" : "絞り込みを解除";
  byId("live-link").href = xSearch([state.query, categories[state.category].query].filter(Boolean).join(" "));
}

for (const [id, category] of Object.entries(categories)) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pill";
  button.dataset.category = id;
  button.textContent = category.label;
  button.addEventListener("click", () => {
    state.category = id;
    render();
  });
  byId("categories").append(button);
}

function resetFilters() {
  state.category = "all";
  state.query = "";
  search.value = "";
}

for (const button of document.querySelectorAll("[data-view]")) {
  button.addEventListener("click", () => {
    if (state.view !== button.dataset.view) resetFilters();
    state.view = button.dataset.view;
    render();
    byId("ranking").scrollIntoView({ block: "start" });
  });
}
for (const button of document.querySelectorAll("[data-period]")) {
  button.addEventListener("click", () => {
    state.period = Number(button.dataset.period);
    render();
  });
}
search.addEventListener("input", () => {
  state.query = search.value;
  render();
});
byId("close-detail").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
    dialog.close();
  }
});
byId("empty-action").addEventListener("click", () => {
  if (state.view === "saved" && state.saved.size === 0) state.view = "rank";
  resetFilters();
  render();
  search.focus();
});

addIcons();
render();
