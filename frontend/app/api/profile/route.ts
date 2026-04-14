import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

// GET — return the authenticated wallet's profile row, or a default shell
// with nulls if the user has not set anything yet. Always scoped to
// session.address so one user can never read another's profile.
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.address, session.address!));

  if (!row) {
    return Response.json({
      address: session.address,
      displayName: null,
      email: null,
      createdAt: null,
      updatedAt: null,
    });
  }
  return Response.json(row);
}

type ProfilePatch = {
  displayName?: string | null;
  email?: string | null;
};

// Minimal, deliberately-strict body validator. Rejects any unknown field so
// a client cannot slip in a crafted column name. Keeps us free of a runtime
// validator dep (zod) — the input surface is two strings.
function parseProfilePatch(raw: unknown): ProfilePatch | null {
  if (typeof raw !== "object" || raw === null) return null;
  const allowed = new Set(["displayName", "email"]);
  for (const k of Object.keys(raw)) if (!allowed.has(k)) return null;

  const input = raw as Record<string, unknown>;
  const patch: ProfilePatch = {};

  if ("displayName" in input) {
    const v = input.displayName;
    if (v !== null && (typeof v !== "string" || v.length > 64)) return null;
    patch.displayName = v as string | null;
  }
  if ("email" in input) {
    const v = input.email;
    if (v !== null) {
      if (typeof v !== "string" || v.length > 255) return null;
      // Boring shape check — not a delivery guarantee, just rejection of
      // obvious junk. No verification flow ships in v2.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
    }
    patch.email = v as string | null;
  }
  return patch;
}

// PUT — upsert display name / email for the authenticated wallet. Both
// fields are opt-in PII; the default row is pure address-only.
export async function PUT(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response("invalid body", { status: 400 });
  }

  const patch = parseProfilePatch(raw);
  if (!patch) return new Response("invalid body", { status: 400 });

  const now = new Date();
  await db
    .insert(profiles)
    .values({
      address: session.address!,
      displayName: patch.displayName ?? null,
      email: patch.email ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: profiles.address,
      set: {
        displayName: patch.displayName ?? null,
        email: patch.email ?? null,
        updatedAt: now,
      },
    });

  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.address, session.address!));
  return Response.json(row);
}
