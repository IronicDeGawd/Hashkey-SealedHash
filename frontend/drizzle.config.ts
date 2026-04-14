import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// Next.js loads `.env.local` automatically at runtime, but drizzle-kit runs
// outside Next so we load it by hand. Fall back to `.env` for CI / deploy
// shells that prefer the plain name.
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
