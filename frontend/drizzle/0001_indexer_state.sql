CREATE TABLE "indexer_state" (
	"key" text PRIMARY KEY NOT NULL,
	"last_indexed_block" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "indexer_state" ("key", "last_indexed_block") VALUES ('sealed_bid_auction', 0) ON CONFLICT DO NOTHING;
