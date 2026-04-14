CREATE TABLE "auction_history" (
	"chain_id" integer NOT NULL,
	"auction" text NOT NULL,
	"auction_id" bigint NOT NULL,
	"bidder" text NOT NULL,
	"event_type" varchar(16) NOT NULL,
	"tx_hash" text NOT NULL,
	"block_number" bigint NOT NULL,
	"payload" jsonb NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auction_history_chain_id_auction_auction_id_bidder_event_type_tx_hash_pk" PRIMARY KEY("chain_id","auction","auction_id","bidder","event_type","tx_hash")
);
--> statement-breakpoint
CREATE TABLE "nonce_backups" (
	"address" text NOT NULL,
	"scope" text NOT NULL,
	"ciphertext" "bytea" NOT NULL,
	"iv" "bytea" NOT NULL,
	"ad" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nonce_backups_address_scope_pk" PRIMARY KEY("address","scope")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"address" text PRIMARY KEY NOT NULL,
	"display_name" varchar(64),
	"email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nonce_backups" ADD CONSTRAINT "nonce_backups_address_profiles_address_fk" FOREIGN KEY ("address") REFERENCES "public"."profiles"("address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auction_history_bidder_idx" ON "auction_history" USING btree ("bidder");--> statement-breakpoint
CREATE INDEX "auction_history_auction_idx" ON "auction_history" USING btree ("chain_id","auction","auction_id");--> statement-breakpoint
CREATE INDEX "nonce_backups_address_idx" ON "nonce_backups" USING btree ("address");