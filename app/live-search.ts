import { useEffect, useState } from "react";
import { normalizeSearch } from "../lib/ranking-model";

export function useLiveSearch(enabled: boolean, query: string) {
  const keyword = enabled ? normalizeSearch(query) : "";
  const [result, setResult] = useState<{ keyword: string; ids: string[] | null }>();

  useEffect(() => {
    if (!keyword) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: keyword });
        const response = await fetch(`/api/rankings/search?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed");
        const { ids } = await response.json() as { ids: string[] };
        if (!controller.signal.aborted) setResult({ keyword, ids });
      } catch {
        if (!controller.signal.aborted) setResult({ keyword, ids: null });
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [keyword]);

  const current = keyword && result?.keyword === keyword ? result : undefined;
  return {
    pending: Boolean(keyword && !current),
    failed: current?.ids === null,
    matched: current?.ids ? new Set(current.ids) : undefined,
  };
}
