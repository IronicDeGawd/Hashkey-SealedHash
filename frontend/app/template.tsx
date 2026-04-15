"use client";

import { PageTransition } from "@/components/chrome/page-transition";

/**
 * Next.js App Router template. Unlike layout.tsx (which persists across
 * navigations), template.tsx re-mounts its children on every route change.
 * We use this to re-fire the PageTransition curtain animation without any
 * manual router interception.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
