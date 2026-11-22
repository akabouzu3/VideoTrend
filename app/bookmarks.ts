import { postIdPattern } from "../lib/ranking-model";
import { videosById } from "./video-data";

const emptySnapshot = "[]";

function bookmarkStore(storageKey: string, acceptsId: (id: string) => boolean) {
  const listeners = new Set<() => void>();
  let memorySnapshot: string | undefined;

  function subscribe(onChange: () => void) {
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

  function getSnapshot() {
    if (memorySnapshot !== undefined) return memorySnapshot;
    try {
      return window.localStorage.getItem(storageKey) ?? emptySnapshot;
    } catch {
      return emptySnapshot;
    }
  }

  function parse(snapshot: string) {
    try {
      const ids: unknown = JSON.parse(snapshot);
      if (!Array.isArray(ids)) return new Set<string>();
      return new Set(ids.filter((id): id is string => typeof id === "string" && acceptsId(id)));
    } catch {
      return new Set<string>();
    }
  }

  function toggle(id: string) {
    const ids = parse(getSnapshot());
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

  return { subscribe, getSnapshot, getServerSnapshot: () => emptySnapshot, parse, toggle };
}

export const sampleBookmarks = bookmarkStore("videotrend-bookmarks", (id) => videosById.has(id));
export const liveBookmarks = bookmarkStore("videotrend-x-bookmarks", (id) => postIdPattern.test(id));
