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

/** The same for a box that scrolls up and down: which edge still has hidden content. Use `data-vhint` and `scrollHintYClass`. */
export function useVerticalScrollHint(ref: RefObject<HTMLElement | null>, watch?: unknown): "top" | "bottom" | "both" | undefined {
  const [hint, setHint] = useState<"top" | "bottom" | "both" | undefined>();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 1) return setHint(undefined);
      const before = el.scrollTop > 1;
      const after = el.scrollTop < max - 1;
      setHint(before && after ? "both" : after ? "bottom" : before ? "top" : undefined);
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
  }, [ref, watch]);
  return hint;
}

export const scrollHintYClass =
  "data-[vhint=bottom]:[mask-image:linear-gradient(to_bottom,#000_calc(100%-1.5rem),transparent)] " +
  "data-[vhint=top]:[mask-image:linear-gradient(to_top,#000_calc(100%-1.5rem),transparent)] " +
  "data-[vhint=both]:[mask-image:linear-gradient(to_bottom,transparent,#000_1.5rem,#000_calc(100%-1.5rem),transparent)]";
