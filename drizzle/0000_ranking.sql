CREATE SCHEMA "videotrend";
--> statement-breakpoint
CREATE TYPE "videotrend"."video_category" AS ENUM('animals', 'daily', 'food', 'sports', 'music');--> statement-breakpoint
CREATE TABLE "videotrend"."ranking_posts" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"category" "videotrend"."video_category" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"reaction_count" bigint NOT NULL,
	"duration_ms" integer,
	"search_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videotrend"."ranking_state" (
	"id" smallint PRIMARY KEY NOT NULL,
	"revision" uuid DEFAULT gen_random_uuid() NOT NULL,
	"updated_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	CONSTRAINT "ranking_state_singleton" CHECK ("videotrend"."ranking_state"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "videotrend"."suppressed_posts" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
