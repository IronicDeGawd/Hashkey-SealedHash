import * as React from "react";
import { cn } from "@/lib/cn";

type CardVariant = "paper" | "white" | "lime" | "ink";

type CardProps = {
  variant?: CardVariant;
  hover?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

const variants: Record<CardVariant, string> = {
  paper: "bg-paper text-ink",
  white: "bg-white text-ink",
  lime: "bg-lime text-ink",
  ink: "bg-ink text-white",
};

export function Card({
  variant = "paper",
  hover = true,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "relative rounded-[45px] border border-ink p-8 md:p-10",
        "shadow-[0_5px_0_0_theme(colors.ink)]",
        hover && "transition-transform duration-200 ease-out hover:-translate-y-1",
        variants[variant],
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
        "font-display text-[26px] font-semibold leading-[1.1] tracking-tight md:text-[30px]",
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
    <div className={cn("text-[15px] leading-relaxed text-current/80", className)}>
      {children}
    </div>
  );
}
