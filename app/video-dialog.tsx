import { useEffect, useRef, type MouseEvent } from "react";
import { categoryBadge, thumbnailPosition } from "./video-card";
import { categories, type Video } from "./video-data";
import { Icon, XSearchLink } from "./video-ui";

export function VideoDialog({ video, onClose }: { video: Video | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (video && dialog && !dialog.open) dialog.showModal();
  }, [video]);

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
      className="m-auto max-h-[calc(100%-28px)] w-[min(540px,calc(100%-28px))] overflow-y-auto rounded-[17px] border border-line bg-white p-0 text-ink shadow-[0_20px_65px_#24121d55] backdrop:bg-[#2a192bc2]"
      onClose={onClose}
      onClick={closeFromBackdrop}
    >
      {video && (
        <>
          <div className="flex items-center justify-between gap-2.5 px-[13px] py-2 text-sm font-bold">
            <span>サンプル投稿</span>
            <form method="dialog">
              <button type="submit" aria-label="閉じる" className="grid size-[42px] place-items-center rounded-[11px] bg-[#f6edf2] hover:bg-blush hover:text-accent">
                <Icon name="close" className="size-[19px]" />
              </button>
            </form>
          </div>
          <div className="sample-thumbnail" style={{ backgroundPosition: thumbnailPosition(video.tile) }} aria-hidden="true" />
          <div className="px-[21px] pt-[18px] pb-[22px]">
            <span className={categoryBadge}>{categories[video.category].label}</span>
            <h2 id="detail-title" className="mt-1.5 mb-2 text-[1.35rem] font-bold">{video.title}</h2>
            <p id="detail-description" className="mb-[15px] text-[0.9375rem] text-muted">{video.description}</p>
            <XSearchLink topic={video.search} />
          </div>
        </>
      )}
    </dialog>
  );
}
