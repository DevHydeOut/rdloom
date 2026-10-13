"use client";

import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type PointerEvent } from "react";
import { spotlightCardDefaults, type SpotlightCardSpecProps } from "../generated/spotlight-card.types";
import { cx } from "../utils/cx";
import { motionVars, prefersReducedMotion } from "../utils/motion";

export interface SpotlightCardProps
  extends SpotlightCardSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof SpotlightCardSpecProps | "className"> {
  className?: string;
}

/**
 * A card with a soft light that follows the pointer. The light is a decoration layer behind the content:
 * off for touch, reduced motion, rdm-still and isPaused. The card sets no focus styling of its own, so a
 * focusable child keeps its own focus ring.
 */
export const SpotlightCard = forwardRef<HTMLDivElement, SpotlightCardProps>(function SpotlightCard(
  { children, size = spotlightCardDefaults.size, color, isPaused = spotlightCardDefaults.isPaused, className, style, onPointerMove, onPointerLeave, ...rest },
  ref,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const set = (node: HTMLDivElement | null) => {
    root.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const move = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const el = root.current;
    if (!el) return;
    if (e.pointerType === "touch" || isPaused || prefersReducedMotion() || el.closest(".rdm-still")) {
      el.removeAttribute("data-rdm-on");
      return;
    }
    const box = el.getBoundingClientRect();
    el.style.setProperty("--rdm-x", `${e.clientX - box.left}px`);
    el.style.setProperty("--rdm-y", `${e.clientY - box.top}px`);
    el.setAttribute("data-rdm-on", "");
  };
  const leave = (e: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e);
    root.current?.removeAttribute("data-rdm-on");
  };

  return (
    <div
      {...rest}
      ref={set}
      data-rdm-paused={isPaused || undefined}
      onPointerMove={move}
      onPointerLeave={leave}
      className={cx(
        "rdm-spotlight relative isolate overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5 text-[var(--rd-color-text-default)]",
        className,
      )}
      style={{ ...(motionVars({ "--rdm-r": `${size}px`, "--rdm-c": color }) as CSSProperties), ...style }}
    >
      <div aria-hidden="true" className="rdm-spotlight-glow" />
      <div className="relative">{children}</div>
    </div>
  );
});
