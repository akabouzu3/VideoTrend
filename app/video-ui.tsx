import Link from "next/link";
import { xSearch } from "./video-data";

const glyphs = {
  triangle: <path d="M8 4.5 20 12 8 19.5Z" fill="currentColor" />,
  trend: <path d="m3 17 6-6 4 4 7-8M14 7h6v6" />,
  bookmark: <path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4-6 4z" />,
  search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4 4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  eye: <><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" /><circle cx="12" cy="12" r="2.6" /></>,
  external: <path d="M13 5h6v6m0-6-8 8M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
};

export function Icon({ name, className = "size-4" }: {
  name: keyof typeof glyphs;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyphs[name]}
    </svg>
  );
}

export function Brand({ compact = false, onNavigate }: { compact?: boolean; onNavigate: () => void }) {
  return (
    <Link
      href="/"
      aria-label="VideoTrend ホーム"
      scroll={false}
      onNavigate={onNavigate}
      className={`inline-flex items-center gap-2 whitespace-nowrap font-[850] tracking-[-0.065em] ${
        compact ? "text-lg" : "text-[1.375rem] max-[600px]:gap-1.5 max-[600px]:text-lg"
      }`}
    >
      <span className={`grid place-items-center bg-pink text-white ${
        compact ? "size-7 rounded-lg" : "size-[34px] rounded-[10px] max-[600px]:size-[29px] max-[600px]:rounded-lg"
      }`}>
        <Icon name="triangle" className={compact ? "size-3.5" : "size-4"} />
      </span>
      <span>Video<span className="text-accent">Trend</span></span>
    </Link>
  );
}

export function Hero() {
  return (
    <section
      aria-labelledby="headline"
      className="hero-cover relative isolate mt-8 overflow-hidden rounded-3xl border border-[#f5dce6] px-11 pt-[34px] pb-9 max-[850px]:px-[31px] max-[600px]:mt-[17px] max-[600px]:rounded-[17px] max-[600px]:px-[15px] max-[600px]:py-6"
    >
      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#f2cbd9] bg-[#fff9fb] px-2.5 py-1 text-sm font-bold text-[#aa2450]">
          <Icon name="trend" />Xの動画ランキング
        </span>
        <h1 id="headline" className="mt-3 mb-3.5 text-[clamp(2rem,4.4vw,3.6rem)] leading-[1.14] font-black tracking-[-0.065em] max-[600px]:text-[clamp(1.85rem,7.5vw,2.75rem)]">
          いま話題の動画を、<br /><span className="text-accent">ひと目で。</span>
        </h1>
        <p className="text-base font-medium text-muted max-[600px]:text-[0.9375rem]">
          X（旧Twitter）で注目を集める動画を、<br className="hidden max-[600px]:inline" />ランキングから見つけよう。
        </p>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[1%] h-[290px] w-[46%] -translate-y-1/2 text-[#d83c6f] max-[850px]:right-0 max-[600px]:-right-[7%] max-[600px]:w-[45%] max-[600px]:scale-70 max-[600px]:opacity-45"
      >
        <div className="absolute top-[18%] left-[1%] h-[185px] w-[96%] -rotate-22 rounded-[50%] border border-[#eaa5be]" />
        <div className="absolute top-[13%] left-[10%] h-[204px] w-[82%] rotate-24 rounded-[50%] border border-[#f2b6cc]" />
        <div className="hero-play absolute top-[23%] left-[34%] grid size-[142px] -rotate-12 place-items-center rounded-[36px] border border-[#e45080] text-white max-[850px]:top-[27%] max-[850px]:size-[116px] max-[600px]:left-[30%]">
          <Icon name="triangle" className="size-[62px] translate-x-1 max-[850px]:size-[55px]" />
        </div>
        <span className="absolute top-[21%] left-[22%] text-[33px] leading-none">✦</span>
        <span className="absolute top-[20%] right-[14%] text-[42px] leading-none">✧</span>
        <span className="absolute right-[22%] bottom-[12%] text-[23px] leading-none">✦</span>
        <span className="absolute bottom-[13%] left-[18%] grid size-[52px] rotate-10 place-items-center rounded-[15px] border border-[#efbacd] bg-[#fff5f9] shadow-md max-[600px]:hidden">
          <Icon name="trend" className="size-[29px]" />
        </span>
      </div>
    </section>
  );
}

export function XSearchLink({ topic }: { topic: string }) {
  return (
    <a
      href={xSearch(topic)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#efcdd9] px-3.5 py-2 text-sm font-bold text-accent hover:bg-blush"
    >
      <span className="text-[1.05rem] leading-none text-ink" aria-hidden="true">𝕏</span>
      関連動画をXで探す
      <Icon name="external" />
    </a>
  );
}
