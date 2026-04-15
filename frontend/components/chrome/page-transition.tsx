"use client";

import { motion } from "motion/react";

/**
 * Route-change overlay. Mounted from app/template.tsx so Next.js re-mounts
 * it on every navigation — the initial→animate transition runs fresh every
 * time.
 *
 * Two curtains start fully covering the viewport and peel upward from the
 * bottom (scaleY 1 → 0 with transformOrigin bottom). The new page beneath
 * is only visible as each curtain shrinks, so there's no window where the
 * fresh route is rendered underneath an exiting block.
 *
 * Content behind the curtains fades in with a 0.4s delay so it lands just
 * as the lime curtain finishes clearing.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Ink curtain — top layer, peels away first */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[101] bg-[#191A23]"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        style={{ transformOrigin: "bottom" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Lime curtain — second layer, peels away 150ms later */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[100] bg-[#B9FF66]"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        style={{ transformOrigin: "bottom" }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Content fades in once the curtains have cleared */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </>
  );
}
