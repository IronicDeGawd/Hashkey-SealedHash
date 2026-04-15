import Image from "next/image";
import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
}

/**
 * SealedHash wordmark + glyph.
 *
 * variant="dark" — dark navy text on a light background. Uses the ink
 *   mark with a transparent canvas so the white nav shows through cleanly.
 *
 * variant="light" — white text on a dark background (footer). Uses the
 *   lime mark with a transparent canvas so the navy footer shows through.
 */
export function Logo({ className, variant = "dark" }: LogoProps) {
  const isLight = variant === "light";
  const textColor = isLight ? "#FFFFFF" : "#191A23";
  // logo-mark-* variants are alpha-cropped so the glyph fills ~92% of
  // the square in both colors — keeps the on-screen mark visually equal
  // when rendered at a fixed h-9 w-9 box.
  const src = isLight ? "/logo-mark-lime.png" : "/logo-mark-ink.png";
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={src}
        alt="SealedHash"
        width={36}
        height={36}
        priority
        className="h-9 w-9 shrink-0"
      />
      <span
        style={{ color: textColor }}
        className="text-xl font-medium tracking-tight"
      >
        SealedHash
      </span>
    </div>
  );
}
