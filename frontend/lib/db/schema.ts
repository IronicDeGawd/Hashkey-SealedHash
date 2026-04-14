import {
  bigint,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// drizzle-orm 0.45 has no first-class `bytea` helper; the documented pattern
// is customType so we get a typed `Buffer` column without escaping nightmares.
const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

// One row per wallet. `address` is lowercase 0x-hex, app-enforced.
// `displayName` and `email` are opt-in PII — both default to NULL and the
// server only writes them if the authenticated user explicitly PUTs them.
export const profiles = pgTable("profiles", {
  address: text("address").primaryKey(),
  displayName: varchar("display_name", { length: 64 }),
  email: varchar("email", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Encrypted nonce vault. The server stores ciphertext only — it never sees a
// plaintext bid or nonce. `scope` is the same composite key used in the
// browser localStorage path: `${chainId}:${auction}:${auctionId}:${bidder}`
// (all lowercased). Composite PK on (address, scope) makes upserts cheap.
//
// `ad` is the AES-GCM additional-data bytes that were bound at encrypt time
// (typically the UTF-8 bytes of `scope`). The server stores it verbatim and
// the browser supplies it again at decrypt; if anyone swaps ciphertexts
// across rows the auth tag check fails before plaintext is produced.
export const nonceBackups = pgTable(
  "nonce_backups",
  {
    address: text("address")
      .notNull()
      .references(() => profiles.address, { onDelete: "cascade" }),
    scope: text("scope").notNull(),
    ciphertext: bytea("ciphertext").notNull(),
    iv: bytea("iv").notNull(),
    ad: bytea("ad").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.address, t.scope] }),
    addressIdx: index("nonce_backups_address_idx").on(t.address),
  }),
);

// Read-cache derived from on-chain SealedBidAuction events. Authoritative
// state remains the chain — this table may lag, may be wiped and rebuilt by
// the indexer, and must NEVER be consulted for settlement decisions.
//
// Composite PK includes `txHash` so re-running the indexer over the same
// block range is a no-op (INSERT ... ON CONFLICT DO NOTHING).
export const auctionHistory = pgTable(
  "auction_history",
  {
    chainId: integer("chain_id").notNull(),
    auction: text("auction").notNull(),
    auctionId: bigint("auction_id", { mode: "bigint" }).notNull(),
    bidder: text("bidder").notNull(),
    eventType: varchar("event_type", { length: 16 }).notNull(),
    txHash: text("tx_hash").notNull(),
    blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
    payload: jsonb("payload").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({
      columns: [t.chainId, t.auction, t.auctionId, t.bidder, t.eventType, t.txHash],
    }),
    bidderIdx: index("auction_history_bidder_idx").on(t.bidder),
    auctionIdx: index("auction_history_auction_idx").on(t.chainId, t.auction, t.auctionId),
  }),
);
