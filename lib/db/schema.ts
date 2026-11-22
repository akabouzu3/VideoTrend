import { bigint, check, integer, pgSchema, smallint, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { rankingCategories } from "../ranking-model";

export const appSchema = pgSchema("videotrend");
export const category = appSchema.enum("video_category", rankingCategories);

export const rankingPosts = appSchema.table("ranking_posts", {
  id: varchar({ length: 20 }).primaryKey(),
  category: category().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  count: bigint("reaction_count", { mode: "number" }).notNull(),
  durationMs: integer("duration_ms"),
  searchText: text("search_text").notNull(),
});

export const rankingState = appSchema.table("ranking_state", {
  id: smallint().primaryKey(),
  revision: uuid().defaultRandom().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
}, (table) => [
  check("ranking_state_singleton", sql`${table.id} = 1`),
]);

export const suppressedPosts = appSchema.table("suppressed_posts", {
  id: varchar({ length: 20 }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
