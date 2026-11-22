import { useState } from "react";
import type { ManualVideo } from "./manual-posts";

export function ManualVideoPlayer({ video }: { video: Extract<ManualVideo, { playback: "file" }> }) {
  const [unavailable, setUnavailable] = useState(false);
  if (unavailable) {
    return (
      <div className="grid min-h-36 content-center justify-items-center px-4 py-6 text-sm">
        <p role="status">動画を読み込めませんでした。</p>
      </div>
    );
  }
  return (
    <video
      src={video.videoUrl}
      poster={video.thumbnailUrl}
      aria-label={video.title}
      className="aspect-video w-full bg-black"
      autoPlay
      muted
      playsInline
      controls
      onError={() => setUnavailable(true)}
    />
  );
}
