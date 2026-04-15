export function truncateAddress(addr?: string | null, chars = 4): string {
  if (!addr) return "";
  if (addr.length <= chars * 2 + 2) return addr;
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`;
}
