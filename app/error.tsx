"use client";

import { captureException } from "@sentry/nextjs";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <main className="content-width py-12">
      <h1 className="text-2xl font-bold">ページを表示できませんでした</h1>
      <button type="button" className="mt-4 rounded-lg bg-blush px-4 py-2 font-bold text-accent" onClick={reset}>
        もう一度表示する
      </button>
    </main>
  );
}
