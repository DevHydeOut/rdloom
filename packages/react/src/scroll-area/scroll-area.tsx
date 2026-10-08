"use client";

import { forwardRef, useCallback, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { scrollAreaDefaults, type ScrollAreaSpecProps } from "../generated/scroll-area.types";
import { cx } from "../utils/cx";

export interface ScrollAreaProps
  extends ScrollAreaSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ScrollAreaSpecProps | "className" | "role"> {
  className?: string;
}

interface Edges {
  top: boolean;
  bottom: boolean;
  start: boolean;
  end: boolean;
}

const none: Edges = { top: false, bottom: false, start: false, end: false };
const FADE = "1.5rem";

/** Which edges still have content beyond them, read from the scroll position. */
function measure(el: HTMLElement, vertical: boolean, horizontal: boolean): Edges {
  const out = { ...none };
  if (vertical) {
    out.top = el.scrollTop > 1;
    out.bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  }
  if (horizontal) {
    // scrollLeft is 0 at the start edge and runs negative toward the end in right-to-left.
    const pos = Math.abs(el.scrollLeft);
    out.start = pos > 1;
    out.end = pos + el.clientWidth < el.scrollWidth - 1;
  }
  return out;
}

const ramp = (dir: string, from: boolean, to: boolean) =>
  `linear-gradient(${dir}, ${from ? "transparent" : "#000"} 0, #000 ${from ? FADE : "0px"}, #000 calc(100% - ${to ? FADE : "0px"}), ${to ? "transparent" : "#000"} 100%)`;

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  {
    orientation = scrollAreaDefaults.orientation,
    label,
    showFades = scrollAreaDefaults.showFades,
    className,
    style,
    children,
    onScroll,
    ...rest
  },
  forwarded,
) {
  const node = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState<Edges>(none);
  const vertical = orientation !== "horizontal";
  const horizontal = orientation !== "vertical";

  const update = useCallback(() => {
    const el = node.current;
    if (!el || !showFades) return;
    const next = measure(el, vertical, horizontal);
    setEdges((p) => (p.top === next.top && p.bottom === next.bottom && p.start === next.start && p.end === next.end ? p : next));
  }, [showFades, vertical, horizontal]);

  useEffect(() => {
    update();
    const el = node.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [update, children]);

  const setRef = (el: HTMLDivElement | null) => {
    node.current = el;
    if (typeof forwarded === "function") forwarded(el);
    else if (forwarded) forwarded.current = el;
  };

  // The fades are a mask on the region. Only edges with content beyond them fade out.
  const layers: string[] = [];
  if (showFades && (edges.top || edges.bottom)) layers.push(ramp("to bottom", edges.top, edges.bottom));
  if (showFades && (edges.start || edges.end)) layers.push(ramp("to right", edges.start, edges.end));
  const mask = layers.join(", ");
  const maskStyle = (
    mask
      ? { WebkitMaskImage: mask, maskImage: mask, WebkitMaskComposite: "source-in", maskComposite: "intersect" }
      : {}
  ) as CSSProperties;

  return (
    <div
      {...rest}
      ref={setRef}
      role="region"
      aria-label={label}
      tabIndex={0}
      data-orientation={orientation}
      onScroll={(e) => {
        update();
        onScroll?.(e);
      }}
      style={{ ...maskStyle, ...style }}
      className={cx(
        "rounded-[var(--rd-radius-control)] outline-none",
        vertical ? "overflow-y-auto" : "overflow-y-hidden",
        horizontal ? "overflow-x-auto" : "overflow-x-hidden",
        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rd-color-focus-ring)]",
        "[scrollbar-width:thin] [scrollbar-color:var(--rd-color-border-strong)_transparent]",
        "[&::-webkit-scrollbar]:size-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-corner]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--rd-color-border-strong)]",
        "motion-reduce:scroll-auto",
        className,
      )}
    >
      {children}
    </div>
  );
});
