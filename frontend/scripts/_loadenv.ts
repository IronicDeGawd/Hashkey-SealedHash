// Preamble for standalone Node scripts (e.g. scripts/indexer.ts).
//
// Imported before anything that reads process.env at module-init time so
// DATABASE_URL lands in the environment before frontend/lib/db/client.ts
// constructs its Pool. ES module imports are hoisted, so putting `loadEnv`
// calls in the consumer file does not work — the only reliable way to win
// the race is to preload this file.
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();
