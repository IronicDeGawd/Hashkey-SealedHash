import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { nonceBackups } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

// GET /api/nonces — list every encrypted backup for the signed-in wallet.
// The server never decrypts, inspects, or parses the ciphertext — it is
// opaque bytes to this handler. The browser re-derives the backup key from
// a wallet signature and decrypts locally (Phase 5).
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const rows = await db
    .select()
    .from(nonceBackups)
    .where(eq(nonceBackups.address, session.address!));

  // Serialize bytea as base64. The browser reverses this before handing
  // bytes to WebCrypto in Phase 5.
  return Response.json(
    rows.map((r) => ({
      scope: r.scope,
      ciphertext: r.ciphertext.toString("base64"),
      iv: r.iv.toString("base64"),
      ad: r.ad.toString("base64"),
      createdAt: r.createdAt,
    })),
  );
}
