import * as React from "react";
import { cn } from "@/lib/cn";

export function PlusIcon({
  open = false,
  size = 58,
  className,
}: {
  open?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full border border-ink bg-white transition-colors",
        className
      )}
      style={{ width: size, height: size }}
    >
      <span className="absolute block h-[2.5px] w-[22px] rounded-full bg-ink" />
      <span
        className={cn(
          "absolute block h-[2.5px] w-[22px] rounded-full bg-ink transition-transform duration-200",
          open ? "rotate-0" : "rotate-90"
        )}
      />
    </span>
  );
}
