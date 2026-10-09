"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type HTMLAttributes } from "react";
import { scrollProgressDefaults, type ScrollProgressSpecProps } from "../generated/scroll-progress.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";

export interface ScrollProgressProps
  extends ScrollProgressSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, "className" | "color" | "children" | keyof ScrollProgressSpecProps> {
  className?: string;
}

/** How often the spoken value may change, in ms, so assistive technology is not flooded while scrolling. */
const ARIA_EVERY = 250;

/**
 * A thin bar that shows how far the page, or the `target` scroller, has been read. It is a progressbar whose
 * aria-valuenow is updated at most a few times a second; it never takes focus or the pointer.
 * Without `target` it is fixed to the viewport. With `target`, place it inside a positioned wrapper around the scroller.
 */
export const ScrollProgress = forwardRef<HTMLDivElement, ScrollProgressProps>(function ScrollProgress(
  {
    target,
    position = scrollProgressDefaults.position,
    label = scrollProgressDefaults.label,
    color = scrollProgressDefaults.color,
    thickness = scrollProgressDefaults.thickness,
    className,
    style,
    ...rest
  },
  forwarded,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const bar = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(forwarded, () => root.current as HTMLDivElement);

  useEffect(() => {
    const scroller = target ? target.current : null;
    if (target && !scroller) return;
    let frame = 0;
    let lastAria = 0;
    let ariaTimer: ReturnType<typeof setTimeout> | undefined;
    let shown = 0;

    const measure = () => {
      const top = scroller ? scroller.scrollTop : window.scrollY;
      const max = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(100, Math.max(0, (top / max) * 100)) : 0;
    };
    const writeAria = () => {
      ariaTimer = undefined;
      lastAria = Date.now();
      root.current?.setAttribute("aria-valuenow", String(shown));
    };
    const update = () => {
      frame = 0;
      const pct = measure();
      if (bar.current) bar.current.style.width = `${pct}%`;
      const rounded = Math.round(pct);
      if (rounded === shown && root.current?.getAttribute("aria-valuenow") === String(rounded)) return;
      shown = rounded;
      if (ariaTimer) return;
      const wait = ARIA_EVERY - (Date.now() - lastAria);
      if (wait <= 0) writeAria();
      else ariaTimer = setTimeout(writeAria, wait);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    const source: EventTarget = scroller ?? window;
    source.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      source.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      if (ariaTimer) clearTimeout(ariaTimer);
    };
  }, [target]);

  return (
    <div
      {...rest}
      ref={root}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      data-position={position}
      data-contained={target ? "" : undefined}
      className={cx("rdm-sprogress", className)}
      style={{ ...style, height: thickness, ...motionVars({ "--rdm-pc": color }) }}
    >
      <div ref={bar} className="rdm-sprogress-bar" />
    </div>
  );
});
