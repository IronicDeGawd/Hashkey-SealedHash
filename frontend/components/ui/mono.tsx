import * as React from "react";
import { cn } from "@/lib/cn";

export function Mono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("font-mono text-sm text-[#191A23]", className)}>
      {children}
    </span>
  );
}
