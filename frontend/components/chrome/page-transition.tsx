"use client";

import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * Route-change overlay. Three colored blocks race down to cover the viewport,
 * then race down again to reveal the next page underneath. Ink leads, white
 * follows by 80ms, lime follows by 160ms.
 *
 * Watches pathname; on change, increments an animation key so the motion
 * component re-runs its keyframes.
 */
export function PageTransition() {
  const pathname = usePathname();
  const [animKey, setAnimKey] = useState(0);
  const firstMount = useRef(true);

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    setAnimKey((n) => n + 1);
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
    >
      <Block key={`ink-${animKey}`} color="#191A23" delay={0} />
      <Block key={`white-${animKey}`} color="#FFFFFF" delay={0.08} />
      <Block key={`lime-${animKey}`} color="#B9FF66" delay={0.16} />
    </div>
  );
}

function Block({ color, delay }: { color: string; delay: number }) {
  return (
    <motion.div
      initial={{ y: "-100%" }}
      animate={{ y: ["-100%", "0%", "0%", "100%"] }}
      transition={{
        duration: 1.4,
        delay,
        times: [0, 0.35, 0.5, 1],
        ease: [0.76, 0, 0.24, 1],
      }}
      className="absolute inset-0 h-full w-full"
      style={{ backgroundColor: color }}
    />
  );
}
