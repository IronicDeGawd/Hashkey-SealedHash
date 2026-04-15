import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
}

export function Logo({ className, variant = "dark" }: LogoProps) {
  const color = variant === "light" ? "#FFFFFF" : "#191A23";
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M14 2v24M2 14h24M5.515 5.515l16.97 16.97M22.485 5.515l-16.97 16.97"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{ color }}
        className="text-xl font-medium tracking-tight"
      >
        SealedHash
      </span>
    </div>
  );
}
