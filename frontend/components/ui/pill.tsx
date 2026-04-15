import * as React from "react";
import { cn } from "@/lib/cn";

type PillTone = "lime" | "paper" | "ink" | "white" | "success" | "danger";

const tones: Record<PillTone, string> = {
  lime: "bg-lime text-ink border-ink",
  paper: "bg-paper text-ink border-ink",
  ink: "bg-ink text-white border-ink",
  white: "bg-white text-ink border-ink",
  success: "bg-success text-white border-ink",
  danger: "bg-danger text-white border-ink",
};

export function Pill({
  tone = "paper",
  children,
  className,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
