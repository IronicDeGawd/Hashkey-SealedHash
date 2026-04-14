export type Profile = {
  address: string;
  displayName: string | null;
  email: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProfilePatch = {
  displayName?: string | null;
  email?: string | null;
};

export async function getProfile(): Promise<Profile> {
  const res = await fetch("/api/profile", { credentials: "include" });
  if (!res.ok) throw new Error(`profile fetch failed: ${res.status}`);
  return (await res.json()) as Profile;
}

export async function updateProfile(patch: ProfilePatch): Promise<Profile> {
  const res = await fetch("/api/profile", {
    method: "PUT",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`profile update failed: ${res.status}`);
  return (await res.json()) as Profile;
}
