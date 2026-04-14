import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { Address } from "viem";

export type SessionData = {
  // Short-lived one-time challenge the client signs. Cleared as soon as
  // /api/auth/verify accepts a signature so the same nonce cannot be replayed.
  nonce?: string;
  // Set only after a successful SIWE verification. Presence of this field is
  // the sole signal of an authenticated session.
  address?: Address;
};

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: "sealedhash_session",
  ttl: 60 * 60 * 8,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    // Cookie must still work over plain HTTP during `next dev`. In production
    // (behind TLS) we force secure; elsewhere fall back to the cookie default
    // so Playwright against localhost doesn't silently drop it.
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession() {
  // Next.js 16 cookies() is async — must await before handing to iron-session.
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

/// Return the session if it has an address, otherwise a ready-to-return 401
/// Response. Every business endpoint starts with this and bails if the second
/// slot of the tuple is non-null — never silently falls back to "anonymous".
export async function requireSession(): Promise<
  { session: Awaited<ReturnType<typeof getSession>>; response: null }
  | { session: null; response: Response }
> {
  const session = await getSession();
  if (!session.address) {
    return {
      session: null,
      response: new Response("unauthorized", { status: 401 }),
    };
  }
  return { session, response: null };
}
