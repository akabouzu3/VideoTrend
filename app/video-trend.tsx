"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getBookmarkSnapshot, getServerBookmarkSnapshot, parseBookmarks,
  subscribeToBookmarks, toggleBookmark,
} from "./bookmarks";
import { VideoCard } from "./video-card";
import { categories, filterVideos, videos, videosById, type Category, type Period, type Video } from "./video-data";
import { VideoDialog } from "./video-dialog";
import { Brand, Hero, Icon, XSearchLink } from "./video-ui";

const periods: { value: Period; label: string }[] = [
  { value: 24, label: "24時間" },
  { value: 72, label: "3日間" },
  { value: 168, label: "1週間" },
];

const categoryIds = Object.keys(categories) as Category[];
const navButton = "inline-flex min-h-[42px] items-center gap-1.75 whitespace-nowrap rounded-[9px] px-3 py-2 text-sm font-bold text-muted hover:bg-blush hover:text-accent aria-[current=page]:bg-blush aria-[current=page]:text-accent max-[600px]:gap-1 max-[600px]:p-[7px] max-[365px]:text-[0.8125rem]";
const pill = "min-h-[39px] rounded-full border border-[#e9e0e6] bg-white px-[13px] py-1.5 text-sm font-bold text-muted hover:border-[#e991ae] hover:text-accent aria-pressed:border-[#f0b3c8] aria-pressed:bg-blush aria-pressed:text-[#a82550]";

type View = "rank" | "saved";

export function VideoTrend() {
  const [view, setView] = useState<View>("rank");
  const [period, setPeriod] = useState<Period>(24);
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);
  const ranking = useRef<HTMLElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const emptyAction = useRef<HTMLButtonElement>(null);
  const nextBookmarkFocus = useRef<string | null>(null);

  const bookmarkSnapshot = useSyncExternalStore(subscribeToBookmarks, getBookmarkSnapshot, getServerBookmarkSnapshot);
  const bookmarks = parseBookmarks(bookmarkSnapshot);
  const savedView = view === "saved";
  const noBookmarks = savedView && bookmarks.size === 0;
  const source = savedView
    ? [...bookmarks].reverse().flatMap((id) => videosById.get(id) ?? [])
    : videos.filter((video) => video.hours <= period).sort((a, b) => b.views - a.views);
  const results = filterVideos(source, category, query);

  useEffect(() => {
    const bookmarkId = nextBookmarkFocus.current;
    if (bookmarkId === null) return;
    nextBookmarkFocus.current = null;
    (document.getElementById(bookmarkId) ?? emptyAction.current)?.focus();
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
    setPeriod(24);
    resetFilters();
    window.scrollTo({ top: 0 });
  }

  function changeBookmark(id: string, index: number) {
    if (savedView) {
      const neighbor = results[index + 1] ?? results[index - 1];
      nextBookmarkFocus.current = neighbor ? `bookmark-${neighbor.video.id}` : "empty-action";
    }
    toggleBookmark(id);
  }

  function clearEmptyState() {
    if (noBookmarks) setView("rank");
    resetFilters();
    searchInput.current?.focus();
  }

  return (
    <>
      <a href="#ranking" className="fixed top-2.5 left-3 z-20 -translate-y-[150%] rounded-lg bg-white px-3.5 py-2 focus:translate-y-0">
        ランキングへ
      </a>
      <header className="border-b border-line bg-white">
        <div className="content-width flex h-[72px] items-center justify-between gap-3.5 max-[600px]:h-[60px] max-[365px]:gap-2">
          <Brand onNavigate={returnHome} />
          <nav aria-label="メインナビゲーション" className="flex items-center gap-2 max-[600px]:gap-px">
            <button type="button" className={navButton} aria-current={savedView ? undefined : "page"} onClick={() => changeView("rank")}>
              <Icon name="trend" className="size-4 max-[600px]:hidden" />ランキング
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
        <Hero />
        <section id="ranking" ref={ranking} aria-labelledby="ranking-title" className="scroll-mt-[15px] pt-9 pb-[42px] max-[600px]:pt-6">
          <div className="flex items-center justify-between gap-4 max-[600px]:flex-col max-[600px]:items-stretch">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-blush text-accent">
                <Icon name={savedView ? "bookmark" : "trend"} className="size-[23px]" />
              </span>
              <div>
                <h2 id="ranking-title" className="text-[clamp(1.3rem,3vw,1.65rem)] font-[850] tracking-[-0.035em]">
                  {savedView ? "保存済みの動画" : "動画ランキング"}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {savedView ? "このブラウザで保存した動画を確認できます。" : "期間とジャンルで、気になる動画を探せます。"}
                </p>
              </div>
            </div>
            {!savedView && (
              <div role="group" aria-label="ランキング期間" className="inline-flex shrink-0 self-center rounded-xl border border-line bg-[#f7f2f5] p-1 max-[600px]:self-start">
                {periods.map(({ value, label }) => (
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
                value={query}
                className="w-full min-w-0 py-1.5 text-sm text-ink focus-visible:outline-none"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-[15px] mb-2.5 flex items-center justify-between text-[0.8125rem] text-muted">
            <p aria-live="polite">{results.length} 件の動画</p>
            <p className="flex items-center gap-1.25"><Icon name="info" className="size-3.5" />サンプルデータ</p>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-3 gap-[18px] max-[850px]:grid-cols-2 max-[600px]:gap-2.5 max-[365px]:grid-cols-1">
              {results.map(({ video, rank }, index) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  rank={savedView ? undefined : rank}
                  saved={bookmarks.has(video.id)}
                  onOpen={() => setSelected(video)}
                  onSave={() => changeBookmark(video.id, index)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-[#e5d1dd] bg-white px-4 py-9 text-center">
              <Icon name="search" className="mx-auto size-[27px] text-accent" />
              <h3 className="mt-2 mb-3.5 font-bold">{noBookmarks ? "保存済みの動画はまだありません" : "条件に合う動画がありません"}</h3>
              <button id="empty-action" ref={emptyAction} type="button" className={pill} onClick={clearEmptyState}>
                {noBookmarks ? "ランキングを見る" : "絞り込みを解除"}
              </button>
            </div>
          )}
          <div className="mt-[25px] text-center">
            <XSearchLink topic={[query, categories[category].query].filter(Boolean).join(" ")} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="content-width flex items-center justify-between gap-3 py-[19px]">
          <Brand compact onNavigate={returnHome} />
          <p className="text-[0.8125rem] text-muted">Xの動画を探せるランキングサイト</p>
        </div>
      </footer>
      <VideoDialog video={selected} onClose={() => setSelected(null)} />
    </>
  );
}
