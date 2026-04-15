import * as React from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  label?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  label,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-5",
        align === "center" && "items-center text-center mx-auto",
        className
      )}
    >
      {label && (
        <span className="inline-block w-fit rounded-[7px] bg-lime px-3 py-1.5 font-display text-sm font-medium uppercase tracking-[0.12em] text-ink">
          {label}
        </span>
      )}
      <h2 className="font-display text-[40px] font-semibold leading-[1.05] tracking-tight text-ink md:text-[52px]">
        {title}
      </h2>
      {description && (
        <p className="text-base text-ink/70 md:text-lg">{description}</p>
      )}
    </div>
  );
}

type DisplayProps = {
  children: React.ReactNode;
  className?: string;
};

export function Display({ children, className }: DisplayProps) {
  return (
    <h1
      className={cn(
        "font-display text-[44px] font-semibold leading-[1.02] tracking-tight text-ink md:text-[60px] lg:text-[72px]",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function Eyebrow({ children, className }: DisplayProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-ink/60",
        className
      )}
    >
      <span className="h-[1px] w-6 bg-ink/60" />
      {children}
    </span>
  );
}
