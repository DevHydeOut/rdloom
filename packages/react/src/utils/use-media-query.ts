import { useSyncExternalStore } from "react";

/**
 * True while `query` matches. On the server (and during hydration) it
 * returns `serverValue`, so pick the value your mobile-first layout expects.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
