"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function truncateAddress(addr?: string | null, chars = 4): string {
  if (!addr) return "";
  if (addr.length <= chars * 2 + 2) return addr;
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`;
}

type AddressProps = {
  value?: string | null;
  chars?: number;
  copyable?: boolean;
  href?: string;
  className?: string;
};

export function Address({
  value,
  chars = 4,
  copyable = true,
  href,
  className,
}: AddressProps) {
  const [copied, setCopied] = React.useState(false);

  if (!value) {
    return <span className={cn("font-mono text-[13px] text-ink/50", className)}>—</span>;
  }

  const label = truncateAddress(value, chars);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // noop
    }
  };

  const content = (
    <>
      <span className="font-mono text-[13px] tracking-tight">{label}</span>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy address"
          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-[6px] border border-ink/20 text-ink/60 transition-colors hover:border-ink hover:bg-lime hover:text-ink"
        >
          {copied ? (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8.5L6.5 12L13 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <rect
                x="4"
                y="4"
                width="9"
                height="9"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M10 3H3.5A.5.5 0 0 0 3 3.5V10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex items-center gap-1 rounded-[7px] border border-ink/15 bg-white px-2 py-1 transition-colors hover:border-ink hover:bg-paper",
          className
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[7px] border border-ink/15 bg-white px-2 py-1",
        className
      )}
    >
      {content}
    </span>
  );
}
