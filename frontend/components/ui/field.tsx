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
  function Field(
    { label, hint, error, mono, trailing, className, id, ...rest },
    ref
  ) {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <label htmlFor={inputId} className={cn("flex flex-col gap-2", className)}>
        <span className="text-base font-medium text-[#191A23]">{label}</span>
        <span className="flex items-center gap-2 rounded-[14px] border border-[#191A23] bg-white px-5 py-4 transition-colors focus-within:bg-[#F3F3F3]">
          <input
            ref={ref}
            id={inputId}
            {...rest}
            className={cn(
              "w-full bg-transparent text-base text-[#191A23] placeholder:text-[#191A23]/30 focus:outline-none",
              mono && "font-mono text-[15px]"
            )}
          />
          {trailing}
        </span>
        {hint && !error && (
          <span className="text-sm text-[#191A23]/60">{hint}</span>
        )}
        {error && (
          <span className="text-sm text-[#8B0000]">{error}</span>
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

export const TextareaField = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(function TextareaField(
  { label, hint, error, className, id, ...rest },
  ref
) {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  return (
    <label htmlFor={inputId} className={cn("flex flex-col gap-2", className)}>
      <span className="text-base font-medium text-[#191A23]">{label}</span>
      <textarea
        ref={ref}
        id={inputId}
        {...rest}
        className="min-h-28 rounded-[14px] border border-[#191A23] bg-white px-5 py-4 text-base text-[#191A23] placeholder:text-[#191A23]/30 focus:bg-[#F3F3F3] focus:outline-none"
      />
      {hint && !error && (
        <span className="text-sm text-[#191A23]/60">{hint}</span>
      )}
      {error && <span className="text-sm text-[#8B0000]">{error}</span>}
    </label>
  );
});
