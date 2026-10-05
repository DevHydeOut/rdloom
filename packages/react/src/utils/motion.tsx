"use client";

import { useEffect, useLayoutEffect, useState } from "react";

// Shared by the motion components. They are optional extras: a project that never
// adds one never carries this file's callers. Every effect follows the same rules:
//   - it is decoration, so the animated layers are hidden from assistive technology
//   - it stands still for people who ask for less motion
//   - it can be paused (isPaused), because moving content must be stoppable
//   - its keyframes and still rules live in one CSS file (motion/rdloom-motion.css) that
//     `rdloom add` installs and imports from your tokens file, so there is nothing to set up

/** useLayoutEffect in the browser, useEffect on the server (which would otherwise warn). */
export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Does the visitor ask for less motion? Reads the setting at call time, so it is safe to use in a layout effect. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True when the visitor asks for less motion, and updates if they change the setting. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** The inline style for the optional CSS variables an effect reads: only the ones that were given. */
export function motionVars(vars: Record<string, string | number | undefined>): React.CSSProperties {
  return Object.fromEntries(Object.entries(vars).filter(([, v]) => v !== undefined)) as React.CSSProperties;
}
