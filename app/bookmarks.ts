import { videosById } from "./video-data";

const storageKey = "videotrend-bookmarks";
const emptySnapshot = "[]";
const listeners = new Set<() => void>();
let memorySnapshot: string | undefined;

export function subscribeToBookmarks(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) onChange();
  }

  listeners.add(onChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getServerBookmarkSnapshot() {
  return emptySnapshot;
}

export function getBookmarkSnapshot() {
  if (memorySnapshot !== undefined) return memorySnapshot;
  try {
    return window.localStorage.getItem(storageKey) ?? emptySnapshot;
  } catch {
    return emptySnapshot;
  }
}

export function parseBookmarks(snapshot: string) {
  try {
    const ids: unknown = JSON.parse(snapshot);
    if (!Array.isArray(ids)) return new Set<string>();
    return new Set(ids.filter((id): id is string => typeof id === "string" && videosById.has(id)));
  } catch {
    return new Set<string>();
  }
}

export function toggleBookmark(id: string) {
  const ids = parseBookmarks(getBookmarkSnapshot());
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  const snapshot = JSON.stringify([...ids]);

  try {
    window.localStorage.setItem(storageKey, snapshot);
    memorySnapshot = undefined;
  } catch {
    memorySnapshot = snapshot;
  }

  for (const listener of listeners) listener();
}
