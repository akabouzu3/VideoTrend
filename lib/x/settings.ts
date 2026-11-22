import { z } from "zod";

export const xSearchLimit = z.coerce.number().int().min(10).max(50).default(20);
export const xTrackedPerWindow = z.coerce.number().int().min(1).max(15).default(10);

export function readXSettings() {
  const token = process.env.X_BEARER_TOKEN?.trim();
  if (!token) throw new Error("X_BEARER_TOKEN is required");
  return {
    token,
    searchLimit: xSearchLimit.parse(process.env.X_SEARCH_LIMIT || undefined),
    trackedPerWindow: xTrackedPerWindow.parse(process.env.X_TRACKED_PER_WINDOW || undefined),
  };
}
