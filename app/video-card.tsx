import Image from "next/image";
import { postUrl } from "../lib/ranking-model";
import type { ManualVideo } from "./manual-posts";
import { categories, score, type Video } from "./video-data";
import { Icon, XPostLink } from "./video-ui";

const viewCount = new Intl.NumberFormat("ja-JP", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const postDate = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", dateStyle: "short" });

const rankColors: Record<number, string> = {
  1: "bg-[#bd2455]",
  2: "bg-[#3e3443]",
  3: "bg-[#855035]",
};

export const categoryBadge = "inline-block rounded-[5px] bg-[#fbeaf1] px-2 py-0.5 text-[0.8125rem] font-bold text-[#a12d53]";
const pictureBadge = "absolute rounded-[7px] px-2 py-[3px] text-[0.8125rem] font-extrabold text-white max-[600px]:px-[5px] max-[600px]:py-0.5 max-[600px]:text-xs";

export function thumbnailPosition(tile: number) {
  return `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 50}%`;
}

export function videoArtwork(video: Video) {
  return video.kind === "x" || video.kind === "manual"
    ? { className: "relative grid aspect-video w-full place-items-center bg-blush text-accent" }
    : { className: "sample-thumbnail relative block", style: { backgroundPosition: thumbnailPosition(video.tile) } };
}

export function ManualVideoPreview({ video, onOpen }: { video: ManualVideo; onOpen?: () => void }) {
  const className = "group relative grid aspect-video w-full place-items-center overflow-hidden bg-blush focus-visible:outline-offset-[-5px]";
  const thumbnail = (
    <>
      <Image
        src={video.thumbnailUrl}
        alt=""
        fill
        unoptimized
        className="object-cover"
        onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
      />
      <span className="relative grid size-12 place-items-center rounded-full bg-black/65 text-white motion-safe:transition-colors group-hover:bg-black/85">
        <Icon name="triangle" className="size-7 translate-x-px" />
      </span>
    </>
  );

  if (video.playback === "x") {
    return (
      <a
        href={postUrl(video.id, video.account)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${video.title}をXで再生`}
        className={className}
      >
        {thumbnail}
        <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-2 py-1 text-xs font-bold text-white">Xで再生</span>
      </a>
    );
  }

  return (
    <button type="button" aria-label={`${video.title}を再生`} className={className} onClick={onOpen}>
      {thumbnail}
    </button>
  );
}

export function VideoCard({ video, rank, saved, onOpen, onSave }: {
  video: Video;
  rank?: number;
  saved: boolean;
  onOpen: () => void;
  onSave: () => void;
}) {
  const saveLabel = saved ? "保存を解除" : "保存";
  const posted = video.hours < 1 ? "1時間以内"
    : video.hours < 24 ? `${Math.floor(video.hours)}時間前` : `${Math.floor(video.hours / 24)}日前`;
  const artwork = videoArtwork(video);
  const saveButton = (
    <button
      id={`bookmark-${video.id}`}
      type="button"
      className={`group grid size-[42px] place-items-center rounded-[11px] bg-white hover:bg-[#ffe7ef] hover:text-accent aria-pressed:bg-[#ffe7ef] aria-pressed:text-accent ${
        video.kind === "manual" ? "border border-line" : "absolute top-2 right-2 max-[600px]:top-1 max-[600px]:right-1 max-[600px]:size-9"
      }`}
      aria-label={`${video.title}：${saveLabel}`}
      aria-pressed={saved}
      title={saveLabel}
      onClick={onSave}
    >
      <Icon name="bookmark" className="size-[19px] group-aria-pressed:fill-current" />
    </button>
  );

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white hover:shadow-md motion-safe:transition-shadow max-[600px]:rounded-xl">
      {video.kind === "manual" ? (
        <ManualVideoPreview video={video} onOpen={onOpen} />
      ) : (
        <div className="relative">
          <button
            type="button"
            className={`${artwork.className} focus-visible:outline-offset-[-5px]`}
            style={artwork.style}
            aria-label={`${video.title}の詳細を見る`}
            onClick={onOpen}
          >
            {rank !== undefined && (
              <span className={`${pictureBadge} top-2.5 left-2.5 max-[600px]:top-1.5 max-[600px]:left-1.5 ${rankColors[rank] ?? "bg-[#291c27d9]"}`}>
                #{rank}
              </span>
            )}
            {video.kind === "x" && <Icon name="triangle" className="size-12" />}
            {video.duration !== null && (
              <span className={`${pictureBadge} right-[9px] bottom-[9px] bg-[#291c27d9] tabular-nums max-[600px]:right-1.5 max-[600px]:bottom-1.5`}>
                {video.duration}
              </span>
            )}
          </button>
          {saveButton}
        </div>
      )}
      <div className="px-3.5 pt-[13px] pb-3.5 max-[600px]:p-[9px]">
        {video.kind === "manual" ? (
          <div className="flex items-center justify-between gap-2">
            <span className={categoryBadge}>{categories[video.category].label}</span>
            {saveButton}
          </div>
        ) : <span className={categoryBadge}>{categories[video.category].label}</span>}
        <h3 className="mt-1.25 text-base font-extrabold max-[600px]:text-[0.9375rem]">
          <button type="button" className="block w-full text-left hover:text-accent" onClick={onOpen}>
            {video.title}
          </button>
        </h3>
        <p className="mt-[9px] flex items-center justify-between gap-1.5 text-[0.8125rem] text-muted max-[600px]:mt-1.5 max-[600px]:flex-wrap max-[600px]:gap-x-2 max-[600px]:gap-y-[3px]">
          {video.kind === "manual" ? (
            <>
              <span>@{video.account}</span>
              <time className="whitespace-nowrap" dateTime={video.createdAt}>{postDate.format(new Date(video.createdAt))}</time>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.25">
                <Icon name={video.kind === "x" ? "trend" : "eye"} className="size-[15px]" />
                {viewCount.format(score(video))}{video.kind === "x" ? "件の反応" : "回再生"}
              </span>
              <span className="whitespace-nowrap">{posted}</span>
            </>
          )}
        </p>
        {video.kind === "manual" && (
          <div className="mt-3"><XPostLink id={video.id} account={video.account} /></div>
        )}
      </div>
    </article>
  );
}
