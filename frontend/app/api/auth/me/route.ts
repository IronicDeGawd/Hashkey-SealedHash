import { getSession } from "@/lib/session";

// Returns the authenticated wallet address, or null. Used by the client on
// mount to bootstrap session state without forcing another signature.
export async function GET() {
  const session = await getSession();
  return Response.json({ address: session.address ?? null });
}
