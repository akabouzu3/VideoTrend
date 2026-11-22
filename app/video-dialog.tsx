import { useEffect, useRef, type MouseEvent, type TouchEvent } from "react";
import { categoryBadge, ManualVideoPreview, videoArtwork } from "./video-card";
import { categories, type Video } from "./video-data";
import { Icon, XPostLink, XSearchLink } from "./video-ui";
import { XVideoPlayer } from "./x-video-player";

type Navigation = {
  position: number;
  total: number;
  previous?: () => void;
  next?: () => void;
};

const navigationButton = "min-h-11 rounded-lg border border-line px-3 py-2 font-bold text-accent hover:bg-blush disabled:cursor-default disabled:text-muted/60 disabled:hover:bg-white";

export function VideoDialog({ video, navigation, onClose }: {
  video: Video | null;
  navigation?: Navigation;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const swipeOrigin = useRef<{ x: number; y: number; id: number } | null>(null);
  const artwork = video && video.kind !== "manual" ? videoArtwork(video) : undefined;
  const activeId = video?.id;

  useEffect(() => {
    const dialog = ref.current;
    if (!activeId || !dialog) return;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }, [activeId]);

  function startSwipe(event: TouchEvent<HTMLDialogElement>) {
    const touch = event.touches[0];
    swipeOrigin.current = navigation && event.touches.length === 1
      ? { x: touch.clientX, y: touch.clientY, id: touch.identifier }
      : null;
  }

  function endSwipe(event: TouchEvent<HTMLDialogElement>) {
    const origin = swipeOrigin.current;
    swipeOrigin.current = null;
    if (!origin || !navigation) return;
    const touch = Array.from(event.changedTouches).find(({ identifier }) => identifier === origin.id);
    if (!touch) return;

    const horizontal = touch.clientX - origin.x;
    const vertical = touch.clientY - origin.y;
    if (Math.abs(horizontal) < 55 || Math.abs(horizontal) < Math.abs(vertical) * 1.3) return;
    (horizontal < 0 ? navigation.next : navigation.previous)?.();
  }

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    if (event.target !== dialog) return;
    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      dialog.close();
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="detail-title"
      aria-describedby="detail-description"
      className="m-auto max-h-[calc(100%-28px)] w-[min(540px,calc(100%-28px))] touch-pan-y overflow-y-auto rounded-[17px] border border-line bg-white p-0 text-ink shadow-[0_20px_65px_#24121d55] backdrop:bg-[#2a192bc2]"
      onClose={onClose}
      onClick={closeFromBackdrop}
      onTouchStart={startSwipe}
      onTouchEnd={endSwipe}
      onTouchCancel={() => { swipeOrigin.current = null; }}
    >
      {video && (
        <>
          <div className="flex items-center justify-between gap-2.5 px-[13px] py-2 text-sm font-bold">
            <span>{video.kind === "manual" ? `Xの投稿（@${video.account}）` : video.kind === "x" ? "Xの投稿" : "サンプル投稿"}</span>
            <form method="dialog">
              <button type="submit" aria-label="閉じる" className="grid size-[42px] place-items-center rounded-[11px] bg-[#f6edf2] hover:bg-blush hover:text-accent">
                <Icon name="close" className="size-[19px]" />
              </button>
            </form>
          </div>
          {navigation && (
            <div role="group" aria-label="動画の切り替え" className="flex items-center justify-between gap-2 border-y border-line px-[13px] py-2 text-sm">
              <button type="button" className={navigationButton} disabled={!navigation.previous} onClick={navigation.previous}>
                前の動画
              </button>
              <span aria-live="polite" className="tabular-nums text-muted">{navigation.position} / {navigation.total}</span>
              <button type="button" className={navigationButton} disabled={!navigation.next} onClick={navigation.next}>
                次の動画
              </button>
            </div>
          )}
          {artwork && (
            <div className={artwork.className} style={artwork.style} aria-hidden="true">
              {video.kind === "x" && <Icon name="triangle" className="size-14" />}
            </div>
          )}
          {video.kind === "manual" && video.playback === "embed" && (
            <XVideoPlayer key={video.id} id={video.id} title={video.title} />
          )}
          {video.kind === "manual" && video.playback === "x" && <ManualVideoPreview video={video} />}
          {video.kind === "manual" && video.playback === "file" && (
            <video
              key={video.id}
              src={video.videoUrl}
              poster={video.thumbnailUrl}
              aria-label={video.title}
              className="aspect-video w-full bg-black"
              autoPlay
              muted
              playsInline
              controls
            />
          )}
          <div className="px-[21px] pt-[18px] pb-[22px]">
            <span className={categoryBadge}>{categories[video.category].label}</span>
            <h2 id="detail-title" className="mt-1.5 mb-2 text-[1.35rem] font-bold">{video.title}</h2>
            <p id="detail-description" className="mb-[15px] text-[0.9375rem] text-muted">
              {video.kind === "x" ? "動画と投稿本文は、Xの元投稿で確認できます。" : video.description}
            </p>
            {video.kind === "manual" || video.kind === "x"
              ? <XPostLink id={video.id} account={video.kind === "manual" ? video.account : undefined} />
              : <XSearchLink topic={video.search} />}
          </div>
        </>
      )}
    </dialog>
  );
}
