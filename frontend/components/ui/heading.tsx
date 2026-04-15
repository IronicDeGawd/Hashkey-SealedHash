import * as React from "react";
import { cn } from "@/lib/cn";

type LabelVariant = "green" | "white" | "black";

const labelVariantClass: Record<LabelVariant, string> = {
  green: "bg-[#B9FF66] text-[#191A23]",
  white: "bg-white text-[#191A23]",
  black: "bg-[#191A23] text-white",
};

export function SectionHeading({
  label,
  title,
  variant = "green",
  className,
}: {
  label?: string;
  title: React.ReactNode;
  variant?: LabelVariant;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {label && (
        <span
          className={cn(
            "inline-block w-fit rounded-[7px] px-[7px] py-[5px] text-xl font-medium",
            labelVariantClass[variant]
          )}
        >
          {label}
        </span>
      )}
      <h2
        className={cn(
          "text-[40px] leading-[1.2] font-medium",
          variant === "white" ? "text-white" : "text-[#191A23]"
        )}
      >
        {title}
      </h2>
    </div>
  );
}

export function Pill({
  children,
  variant = "green",
  className,
}: {
  children: React.ReactNode;
  variant?: LabelVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block w-fit rounded-[7px] px-[7px] py-[5px] text-base font-medium",
        labelVariantClass[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
