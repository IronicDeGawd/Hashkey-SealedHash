import * as React from "react";
import { cn } from "@/lib/cn";

export function LogoMark({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="10"
        fill="var(--color-lime)"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <path
        d="M13 17v-3a7 7 0 0 1 14 0v3"
        stroke="var(--color-ink)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect
        x="10"
        y="17"
        width="20"
        height="14"
        rx="3"
        fill="var(--color-ink)"
      />
      <path
        d="M15 24h10M15 27h10"
        stroke="var(--color-lime)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  size = 36,
  showWordmark = true,
}: {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="font-display text-[22px] font-semibold tracking-tight text-ink">
          SealedHash
        </span>
      )}
    </span>
  );
}
