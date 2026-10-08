"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Tells you which edges of a sideways-scrolling box still have hidden content, so a fade can say "this scrolls".
 * Put the result on the box as `data-hint` and add `scrollHintClass`.
 */
export function useScrollHint(ref: RefObject<HTMLElement | null>): "left" | "right" | "both" | undefined {
  const [hint, setHint] = useState<"left" | "right" | "both" | undefined>();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) return setHint(undefined);
      const pos = Math.abs(el.scrollLeft);
      const before = pos > 1;
      const after = pos < max - 1;
      const left = rtl ? after : before;
      const right = rtl ? before : after;
      setHint(left && right ? "both" : right ? "right" : left ? "left" : undefined);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(el);
    if (el.firstElementChild) observer?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [ref]);
  return hint;
}

/** The fade at the edge that still has content. The sides are physical (left and right). */
export const scrollHintClass =
  "data-[hint=right]:[mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] " +
  "data-[hint=left]:[mask-image:linear-gradient(to_left,#000_calc(100%-2rem),transparent)] " +
  "data-[hint=both]:[mask-image:linear-gradient(to_right,transparent,#000_2rem,#000_calc(100%-2rem),transparent)]";
