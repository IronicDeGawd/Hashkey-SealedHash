import { getSession } from "@/lib/session";

// Destroy the session cookie. Idempotent — calling logout without an active
// session still returns 204.
export async function POST() {
  const session = await getSession();
  session.destroy();
  return new Response(null, { status: 204 });
}
