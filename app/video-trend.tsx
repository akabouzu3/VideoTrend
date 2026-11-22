"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { categoryQuery, type LiveRanking, normalizeSearch } from "../lib/ranking-model";
import { liveBookmarks, sampleBookmarks } from "./bookmarks";
import { useLiveSearch } from "./live-search";
import type { ManualVideo } from "./manual-posts";
import { VideoCard } from "./video-card";
import { categories, filterVideos, publishedVideos, score, videos, videosById, type Category, type Period, type Video } from "./video-data";
import { VideoDialog } from "./video-dialog";
import { Brand, Hero, Icon, XPostLink, XSearchLink } from "./video-ui";

const periods: { value: Period; label: string }[] = [
  { value: 24, label: "24時間" },
  { value: 72, label: "3日間" },
  { value: 168, label: "1週間" },
];
const manualPeriods = [{ value: "all" as const, label: "全期間" }, ...periods];

const categoryIds = Object.keys(categories) as Category[];
const navButton = "inline-flex min-h-[42px] items-center gap-1.75 whitespace-nowrap rounded-[9px] px-3 py-2 text-sm font-bold text-muted hover:bg-blush hover:text-accent aria-[current=page]:bg-blush aria-[current=page]:text-accent max-[600px]:gap-1 max-[600px]:p-[7px] max-[365px]:text-[0.8125rem]";
const pill = "min-h-[39px] rounded-full border border-[#e9e0e6] bg-white px-[13px] py-1.5 text-sm font-bold text-muted hover:border-[#e991ae] hover:text-accent aria-pressed:border-[#f0b3c8] aria-pressed:bg-blush aria-pressed:text-[#a82550]";
const updateTime = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo", dateStyle: "medium", timeStyle: "short",
});

type View = "rank" | "saved";

export function VideoTrend({ live, manual, unavailable = false }: {
  live?: LiveRanking;
  manual?: { asOf: string; videos: ManualVideo[] };
  unavailable?: boolean;
}) {
  const [view, setView] = useState<View>("rank");
  const defaultPeriod = manual ? "all" : 24;
  const [period, setPeriod] = useState<Period | "all">(defaultPeriod);
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);
  const ranking = useRef<HTMLElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const emptyAction = useRef<HTMLButtonElement>(null);
  const nextBookmarkFocus = useRef<string | null>(null);

  const store = live || manual ? liveBookmarks : sampleBookmarks;
  const bookmarkSnapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const bookmarks = store.parse(bookmarkSnapshot);
  const currentVideos = manual ? manual.videos : live ? publishedVideos(live) : videos;
  const currentById = live || manual ? new Map(currentVideos.map((video) => [video.id, video])) : videosById;
  const savedView = view === "saved";
  const noBookmarks = savedView && bookmarks.size === 0;
  const liveSearch = useLiveSearch(Boolean(live?.updatedAt), query);
  const source = savedView
    ? [...bookmarks].reverse().flatMap((id) => currentById.get(id) ?? [])
    : currentVideos.filter((video) => period === "all" || video.hours <= period)
      .sort((a, b) => {
        if (a.kind === "manual" || b.kind === "manual") return a.hours - b.hours;
        return score(b) - score(a) || a.hours - b.hours || b.id.localeCompare(a.id);
      });
  const results = filterVideos(source, category, query, liveSearch.matched);
  const selectedIndex = selected?.kind === "manual"
    ? results.findIndex(({ video }) => video.id === selected.id)
    : -1;
  const archived = (live || manual) && savedView && category === "all" && !normalizeSearch(query)
    ? [...bookmarks].reverse().filter((id) => !currentById.has(id))
    : [];
  const liveNotice = unavailable ? "ランキングを表示できません。時間をおいて再読み込みしてください。"
    : live && !live.updatedAt && !savedView ? "初回のランキング更新を待っています。"
      : null;
  const listLabel = manual ? "手選び動画" : "ランキング";
  const archivedLabel = manual ? "現在の一覧にない保存済み投稿" : "現在のランキングにない保存済み投稿";

  useEffect(() => {
    const bookmarkId = nextBookmarkFocus.current;
    if (bookmarkId === null) return;
    nextBookmarkFocus.current = null;
    (document.getElementById(bookmarkId) ?? emptyAction.current ?? document.getElementById("ranking-title"))?.focus();
  }, [bookmarkSnapshot]);

  function resetFilters() {
    setCategory("all");
    setQuery("");
  }

  function changeView(nextView: View) {
    if (nextView !== view) resetFilters();
    setView(nextView);
    ranking.current?.scrollIntoView({ block: "start" });
  }

  function returnHome() {
    setView("rank");
    setPeriod(defaultPeriod);
    resetFilters();
    window.scrollTo({ top: 0 });
  }

  function changeBookmark(id: string, index: number) {
    if (savedView) {
      const neighbor = results[index + 1] ?? results[index - 1];
      const nextId = neighbor?.video.id ?? archived[0];
      nextBookmarkFocus.current = nextId ? `bookmark-${nextId}` : "empty-action";
    }
    store.toggle(id);
  }

  function removeArchivedBookmark(id: string, index: number) {
    const neighbor = archived[index + 1] ?? archived[index - 1] ?? results.at(-1)?.video.id;
    nextBookmarkFocus.current = neighbor ? `bookmark-${neighbor}` : "empty-action";
    store.toggle(id);
  }

  function clearEmptyState() {
    if (noBookmarks) setView("rank");
    resetFilters();
    searchInput.current?.focus();
  }

  return (
    <>
      <a href="#ranking" className="fixed top-2.5 left-3 z-20 -translate-y-[150%] rounded-lg bg-white px-3.5 py-2 focus:translate-y-0">
        {listLabel}へ
      </a>
      <header className="border-b border-line bg-white">
        <div className="content-width flex h-[72px] items-center justify-between gap-3.5 max-[600px]:h-[60px] max-[365px]:gap-2">
          <Brand href={manual ? "/manual" : "/"} onNavigate={returnHome} />
          <nav aria-label="メインナビゲーション" className="flex items-center gap-2 max-[600px]:gap-px">
            <button type="button" className={navButton} aria-current={savedView ? undefined : "page"} onClick={() => changeView("rank")}>
              <Icon name="trend" className="size-4 max-[600px]:hidden" />{listLabel}
            </button>
            <button type="button" className={navButton} aria-current={savedView ? "page" : undefined} onClick={() => changeView("saved")}>
              <Icon name="bookmark" className="size-4 max-[600px]:hidden" />保存済み
              {bookmarks.size > 0 && (
                <span aria-hidden="true" className="min-w-[19px] rounded-full bg-white px-[3px] text-center text-xs">{bookmarks.size}</span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="content-width">
        <Hero manual={Boolean(manual)} />
        <section id="ranking" ref={ranking} aria-labelledby="ranking-title" className="scroll-mt-[15px] pt-9 pb-[42px] max-[600px]:pt-6">
          <div className="flex items-center justify-between gap-4 max-[600px]:flex-col max-[600px]:items-stretch">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-blush text-accent">
                <Icon name={savedView ? "bookmark" : "trend"} className="size-[23px]" />
              </span>
              <div>
                <h2 id="ranking-title" tabIndex={-1} className="text-[clamp(1.3rem,3vw,1.65rem)] font-[850] tracking-[-0.035em]">
                  {savedView ? "保存済みの動画" : manual ? "手選び動画" : "動画ランキング"}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {savedView ? "このブラウザで保存した動画を確認できます。" : "期間とジャンルで、気になる動画を探せます。"}
                </p>
              </div>
            </div>
            {!savedView && (
              <div role="group" aria-label={manual ? "掲載期間" : "ランキング期間"} className="inline-flex shrink-0 self-center rounded-xl border border-line bg-[#f7f2f5] p-1 max-[600px]:self-start">
                {(manual ? manualPeriods : periods).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={period === value}
                    className="rounded-lg px-[15px] py-[7px] text-sm font-bold whitespace-nowrap text-muted hover:text-accent aria-pressed:bg-white aria-pressed:text-accent aria-pressed:shadow-sm max-[600px]:min-h-[37px] max-[600px]:px-3"
                    onClick={() => setPeriod(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-between gap-3 max-[600px]:mt-[13px] max-[600px]:flex-col">
            <div role="group" aria-label="ジャンル" className="flex flex-wrap gap-[7px]">
              {categoryIds.map((id) => (
                <button key={id} type="button" className={pill} aria-pressed={category === id} onClick={() => setCategory(id)}>
                  {categories[id].label}
                </button>
              ))}
            </div>
            <label className="flex min-h-[39px] w-full max-w-[210px] items-center gap-[7px] self-start rounded-[10px] border border-[#e9e0e6] bg-white px-2.5 text-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent max-[600px]:max-w-none">
              <Icon name="search" />
              <input
                ref={searchInput}
                type="search"
                autoComplete="off"
                aria-label="動画を検索"
                placeholder="動画を検索"
                maxLength={live ? 100 : undefined}
                value={query}
                className="w-full min-w-0 py-1.5 text-sm text-ink focus-visible:outline-none"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-[15px] mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[0.8125rem] text-muted">
            <p aria-live="polite">
              {liveSearch.pending ? "検索中…" : `${results.length + archived.length} 件の動画`}
            </p>
            <p className="flex items-center gap-1.25">
              <Icon name="info" className="size-3.5" />
              {manual ? (
                <time dateTime={manual.asOf}>期間の基準 {updateTime.format(new Date(manual.asOf))} JST</time>
              ) : live ? (
                live.updatedAt ? <time dateTime={live.updatedAt}>更新 {updateTime.format(new Date(live.updatedAt))} JST</time> : "未更新"
              ) : "サンプルデータ"}
            </p>
          </div>
          {live?.updatedAt && !savedView && (
            <p className="mb-3 text-sm text-muted">取得した候補を、いいね・リポスト・返信・引用の合計で順位付けしています。</p>
          )}
          {manual && !savedView && (
            <p className="mb-3 text-sm text-muted">手選びした投稿を新しい順に表示しています。期間は最新の掲載投稿を基準にしています。</p>
          )}

          {liveSearch.failed && <p role="alert" className="mb-3 text-sm text-muted">検索できませんでした。キーワードを入れ直してください。</p>}
          {liveNotice && <p role="status" className="mb-3 text-sm text-muted">{liveNotice}</p>}
          {results.length > 0 && !liveSearch.pending ? (
            <div className="grid grid-cols-3 gap-[18px] max-[850px]:grid-cols-2 max-[600px]:gap-2.5 max-[365px]:grid-cols-1">
              {results.map(({ video, rank }, index) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  rank={savedView || manual ? undefined : rank}
                  saved={bookmarks.has(video.id)}
                  onOpen={() => setSelected(video)}
                  onSave={() => changeBookmark(video.id, index)}
                />
              ))}
            </div>
          ) : !archived.length && !liveNotice && !liveSearch.pending && !liveSearch.failed && (
            <div className="rounded-[14px] border border-dashed border-[#e5d1dd] bg-white px-4 py-9 text-center">
              <Icon name="search" className="mx-auto size-[27px] text-accent" />
              <h3 className="mt-2 mb-3.5 font-bold">{noBookmarks ? "保存済みの動画はまだありません" : "条件に合う動画がありません"}</h3>
              <button id="empty-action" ref={emptyAction} type="button" className={pill} onClick={clearEmptyState}>
                {noBookmarks ? `${listLabel}を見る` : "絞り込みを解除"}
              </button>
            </div>
          )}
          {archived.length > 0 && (
            <section aria-label={archivedLabel} className="mt-5">
              <h3 className="mb-2 font-bold">{archivedLabel}</h3>
              <ul className="space-y-2">
                {archived.map((id, index) => (
                  <li key={id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white p-3">
                    <XPostLink id={id} />
                    <button id={`bookmark-${id}`} type="button" className={pill} onClick={() => removeArchivedBookmark(id, index)}>
                      保存を解除
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="mt-[25px] text-center">
            <XSearchLink topic={[query, categoryQuery(category)].filter(Boolean).join(" ")} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="content-width flex flex-wrap items-center justify-between gap-3 py-[19px]">
          <Brand compact href={manual ? "/manual" : "/"} onNavigate={returnHome} />
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-[0.8125rem] text-muted">
            {!live && !manual && <Link href="/manual" className="hover:underline">手選び動画</Link>}
            <Link href="/about" className="hover:underline">掲載データとプライバシー</Link>
          </div>
        </div>
      </footer>
      <VideoDialog
        video={selected}
        navigation={selectedIndex < 0 || results.length < 2 ? undefined : {
          position: selectedIndex + 1,
          total: results.length,
          previous: selectedIndex > 0 ? () => setSelected(results[selectedIndex - 1].video) : undefined,
          next: selectedIndex < results.length - 1 ? () => setSelected(results[selectedIndex + 1].video) : undefined,
        }}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
