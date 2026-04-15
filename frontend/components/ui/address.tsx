"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/truncate";

export { truncateAddress };

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
    return (
      <span
        className={cn(
          "font-mono text-sm text-[#191A23]/50",
          className
        )}
      >
        —
      </span>
    );
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
      <span className="font-mono text-sm tracking-tight text-[#191A23]">
        {label}
      </span>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy address"
          className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-[7px] border border-[#191A23]/30 text-[#191A23]/60 transition-colors hover:border-[#191A23] hover:bg-[#B9FF66] hover:text-[#191A23]"
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8.5L6.5 12L13 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
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
          "inline-flex items-center gap-2 rounded-[10px] border border-[#191A23]/20 bg-white px-3 py-1.5 transition-colors hover:border-[#191A23] hover:bg-[#F3F3F3]",
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
        "inline-flex items-center gap-2 rounded-[10px] border border-[#191A23]/20 bg-white px-3 py-1.5",
        className
      )}
    >
      {content}
    </span>
  );
}
