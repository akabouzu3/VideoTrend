import { useEffect, useRef, useState } from "react";

type XWidgets = {
  createVideo: (
    id: string,
    target: HTMLElement,
    options: { dnt: boolean; lang: string; conversation: string },
  ) => Promise<HTMLElement | undefined>;
};

const scriptUrl = "https://platform.twitter.com/widgets.js";
let widgetsRequest: Promise<XWidgets> | undefined;

function loadXWidgets() {
  const windowWithX = window as Window & { twttr?: { widgets?: XWidgets } };
  const installed = windowWithX.twttr?.widgets;
  if (typeof installed?.createVideo === "function") return Promise.resolve(installed);

  widgetsRequest ??= new Promise<XWidgets>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;

    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error("X widgets could not be loaded"));
    }

    const timeout = window.setTimeout(fail, 8_000);
    script.addEventListener("error", fail, { once: true });
    script.addEventListener("load", () => {
      const widgets = windowWithX.twttr?.widgets;
      if (typeof widgets?.createVideo !== "function") {
        fail();
        return;
      }
      window.clearTimeout(timeout);
      resolve(widgets);
    }, { once: true });
    document.head.append(script);
  }).catch((error: unknown) => {
    widgetsRequest = undefined;
    throw error;
  });

  return widgetsRequest;
}

export function XVideoPlayer({ id, title }: { id: string; title: string }) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const element = host.current;
    const mountPoint = target.current;
    if (!element || !mountPoint) return;

    const container = document.createElement("div");
    let disposed = false;
    let deadline: number | undefined;

    function fail() {
      if (disposed) return;
      disposed = true;
      window.clearTimeout(deadline);
      container.remove();
      setStatus("failed");
    }

    async function mount() {
      observer.disconnect();
      deadline = window.setTimeout(fail, 12_000);
      try {
        const widgets = await loadXWidgets();
        if (disposed) return;
        mountPoint?.append(container);
        const player = await widgets.createVideo(id, container, {
          dnt: true, lang: "ja", conversation: "none",
        });
        if (disposed) return;
        if (!player) {
          fail();
          return;
        }
        window.clearTimeout(deadline);
        setStatus("ready");
      } catch {
        fail();
      }
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void mount();
    }, { rootMargin: "200px" });
    observer.observe(element);

    return () => {
      disposed = true;
      observer.disconnect();
      window.clearTimeout(deadline);
      container.remove();
    };
  }, [id]);

  return (
    <div
      ref={host}
      role="region"
      aria-label={`${title}の動画プレーヤー`}
      className="min-w-0 [&_iframe]:max-w-full"
    >
      <div ref={target} />
      {status !== "ready" && (
        <p role="status" className="grid aspect-video place-items-center bg-blush px-4 text-center text-sm text-muted">
          {status === "loading" ? "Xの動画プレーヤーを読み込んでいます…" : "Xの動画プレーヤーを表示できませんでした。"}
        </p>
      )}
    </div>
  );
}
