import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "VideoTrend — Xの動画トレンド",
  description: "Xで話題の動画を、期間とジャンルから見つける VideoTrend。",
};

export const viewport: Viewport = {
  themeColor: "#fdfbfc",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
