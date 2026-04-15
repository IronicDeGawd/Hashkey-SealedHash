import { cn } from "@/lib/cn";

interface PlusIconProps {
  className?: string;
  size?: number;
  icon?: "plus" | "minus";
}

export function PlusIcon({
  className,
  size = 58,
  icon = "plus",
}: PlusIconProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-[#191A23] bg-white",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        {icon === "plus" ? (
          <path
            d="M6 1v10M1 6h10"
            stroke="#191A23"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M1 6h10"
            stroke="#191A23"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
}
