import * as React from "react";
import { cn } from "@/lib/cn";

type PillTone =
  | "lime"
  | "paper"
  | "ink"
  | "white"
  | "success"
  | "danger";

const tones: Record<PillTone, string> = {
  lime: "bg-[#B9FF66] text-[#191A23]",
  paper: "bg-[#F3F3F3] text-[#191A23]",
  ink: "bg-[#191A23] text-white",
  white: "bg-white text-[#191A23] border border-[#191A23]",
  success: "bg-[#B9FF66] text-[#191A23]",
  danger: "bg-[#FFE5E5] text-[#8B0000] border border-[#8B0000]",
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
        "inline-flex items-center gap-1.5 rounded-[7px] px-[10px] py-[6px] text-sm font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
