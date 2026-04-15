import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "tertiary" | "secondary";
type Size = "default" | "sm" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "bg-[#191A23] text-white hover:bg-[#191A23]/90",
  tertiary: "bg-[#B9FF66] text-[#191A23] hover:bg-[#B9FF66]/90",
  secondary:
    "border border-[#191A23] bg-transparent text-[#191A23] hover:bg-[#F3F3F3]",
};

const sizeClass: Record<Size, string> = {
  default: "px-[35px] py-[20px] text-base",
  sm: "px-5 py-3 text-sm",
  lg: "px-10 py-6 text-lg",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[14px] font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191A23] focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50";

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "default", className, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        {...rest}
        className={cn(base, variantClass[variant], sizeClass[size], className)}
      />
    );
  }
);

type LinkButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function LinkButton({
  variant = "primary",
  size = "default",
  className,
  ...rest
}: LinkButtonProps) {
  return (
    <a
      {...rest}
      className={cn(base, variantClass[variant], sizeClass[size], className)}
    />
  );
}
