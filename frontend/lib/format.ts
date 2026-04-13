import { formatUnits } from "viem";

export function shortAddress(addr: string | null | undefined, size = 4): string {
  if (!addr) return "-";
  if (addr.length < 2 * size + 2) return addr;
  return `${addr.slice(0, 2 + size)}...${addr.slice(-size)}`;
}

export function formatTokenAmount(amount: bigint, decimals: number, maxFraction = 4): string {
  const raw = formatUnits(amount, decimals);
  const [whole, frac = ""] = raw.split(".");
  if (maxFraction === 0 || frac.length === 0) return whole;
  return `${whole}.${frac.slice(0, maxFraction).padEnd(maxFraction, "0")}`;
}

export function formatUnixSeconds(ts: bigint | number): string {
  const ms = Number(ts) * 1000;
  if (!Number.isFinite(ms)) return "-";
  return new Date(ms).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function countdown(deadline: bigint | number, now = Date.now()): string {
  const target = Number(deadline) * 1000;
  const diff = target - now;
  if (diff <= 0) return "ended";
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
