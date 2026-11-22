import { categories, type Video } from "./video-data";
import { Icon } from "./video-ui";

const viewCount = new Intl.NumberFormat("ja-JP", {
  notation: "compact",
  maximumFractionDigits: 1,
});

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

export function VideoCard({ video, rank, saved, onOpen, onSave }: {
  video: Video;
  rank?: number;
  saved: boolean;
  onOpen: () => void;
  onSave: () => void;
}) {
  const saveLabel = saved ? "保存を解除" : "保存";
  const posted = video.hours < 24 ? `${video.hours}時間前` : `${Math.floor(video.hours / 24)}日前`;

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white hover:shadow-md motion-safe:transition-shadow max-[600px]:rounded-xl">
      <div className="relative">
        <button
          type="button"
          className="sample-thumbnail relative block focus-visible:outline-offset-[-5px]"
          style={{ backgroundPosition: thumbnailPosition(video.tile) }}
          aria-label={`${video.title}の詳細を見る`}
          onClick={onOpen}
        >
          {rank !== undefined && (
            <span className={`${pictureBadge} top-2.5 left-2.5 max-[600px]:top-1.5 max-[600px]:left-1.5 ${rankColors[rank] ?? "bg-[#291c27d9]"}`}>
              #{rank}
            </span>
          )}
          <span className={`${pictureBadge} right-[9px] bottom-[9px] bg-[#291c27d9] tabular-nums max-[600px]:right-1.5 max-[600px]:bottom-1.5`}>
            {video.duration}
          </span>
        </button>
        <button
          id={`bookmark-${video.id}`}
          type="button"
          className="group absolute top-2 right-2 grid size-[42px] place-items-center rounded-[11px] bg-white hover:bg-[#ffe7ef] hover:text-accent aria-pressed:bg-[#ffe7ef] aria-pressed:text-accent max-[600px]:top-1 max-[600px]:right-1 max-[600px]:size-9"
          aria-label={`${video.title}：${saveLabel}`}
          aria-pressed={saved}
          title={saveLabel}
          onClick={onSave}
        >
          <Icon name="bookmark" className="size-[19px] group-aria-pressed:fill-current" />
        </button>
      </div>
      <div className="px-3.5 pt-[13px] pb-3.5 max-[600px]:p-[9px]">
        <span className={categoryBadge}>{categories[video.category].label}</span>
        <h3 className="mt-1.25 text-base font-extrabold max-[600px]:text-[0.9375rem]">
          <button type="button" className="block w-full text-left hover:text-accent" onClick={onOpen}>
            {video.title}
          </button>
        </h3>
        <p className="mt-[9px] flex items-center justify-between gap-1.5 text-[0.8125rem] text-muted max-[600px]:mt-1.5 max-[600px]:flex-wrap max-[600px]:gap-x-2 max-[600px]:gap-y-[3px]">
          <span className="inline-flex items-center gap-1.25">
            <Icon name="eye" className="size-[15px]" />
            {viewCount.format(video.views)}回再生
          </span>
          <span className="whitespace-nowrap">{posted}</span>
        </p>
      </div>
    </article>
  );
}
