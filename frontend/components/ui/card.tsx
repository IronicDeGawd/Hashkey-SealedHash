import * as React from "react";
import { cn } from "@/lib/cn";

type CardVariant = "paper" | "white" | "lime" | "ink";

const variantClass: Record<CardVariant, string> = {
  paper: "bg-[#F3F3F3] text-[#191A23]",
  white: "bg-white text-[#191A23]",
  lime: "bg-[#B9FF66] text-[#191A23]",
  ink: "bg-[#191A23] text-white",
};

type CardProps = {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export function Card({
  variant = "paper",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-[45px] border border-[#191A23] p-10",
        variantClass[variant],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-[30px] leading-[1.3] font-medium text-inherit",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-base leading-relaxed", className)}>
      {children}
    </div>
  );
}
