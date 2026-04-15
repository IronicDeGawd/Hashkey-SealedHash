import * as React from "react";
import { cn } from "@/lib/cn";

type FieldProps = {
  label: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  mono?: boolean;
  trailing?: React.ReactNode;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  function Field({ label, hint, error, mono, trailing, className, id, ...rest }, ref) {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <label
        htmlFor={inputId}
        className={cn("flex flex-col gap-1.5", className)}
      >
        <span className="font-display text-[13px] font-medium uppercase tracking-[0.12em] text-ink/70">
          {label}
        </span>
        <span className="flex items-center gap-2 rounded-[14px] border border-ink bg-white px-4 py-3 transition-colors focus-within:bg-paper">
          <input
            ref={ref}
            id={inputId}
            {...rest}
            className={cn(
              "w-full bg-transparent text-[15px] text-ink placeholder:text-ink/30 focus:outline-none",
              mono && "font-mono text-[14px]"
            )}
          />
          {trailing}
        </span>
        {hint && !error && (
          <span className="font-mono text-[11px] text-ink/50">{hint}</span>
        )}
        {error && (
          <span className="font-mono text-[11px] text-danger">{error}</span>
        )}
      </label>
    );
  }
);

type TextareaProps = {
  label: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function TextareaField({ label, hint, error, className, id, ...rest }, ref) {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <label htmlFor={inputId} className={cn("flex flex-col gap-1.5", className)}>
        <span className="font-display text-[13px] font-medium uppercase tracking-[0.12em] text-ink/70">
          {label}
        </span>
        <textarea
          ref={ref}
          id={inputId}
          {...rest}
          className="min-h-24 rounded-[14px] border border-ink bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink/30 focus:bg-paper focus:outline-none"
        />
        {hint && !error && (
          <span className="font-mono text-[11px] text-ink/50">{hint}</span>
        )}
        {error && (
          <span className="font-mono text-[11px] text-danger">{error}</span>
        )}
      </label>
    );
  }
);
