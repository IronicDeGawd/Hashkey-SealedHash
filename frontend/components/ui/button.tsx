import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-tight " +
  "rounded-[14px] border border-ink transition-[transform,background-color,color] " +
  "duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "disabled:cursor-not-allowed disabled:opacity-40 active:translate-y-[1px] " +
  "whitespace-nowrap select-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-white hover:text-ink",
  accent: "bg-lime text-ink hover:bg-ink hover:text-lime",
  outline: "bg-white text-ink hover:bg-ink hover:text-white",
  ghost: "border-transparent bg-transparent text-ink hover:bg-paper",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-[60px] px-9 text-base",
};

type ButtonProps = BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = BaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function LinkButton({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <a
      {...rest}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
    >
      {children}
    </a>
  );
}
