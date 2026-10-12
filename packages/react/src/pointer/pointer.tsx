"use client";

import { forwardRef, useRef, useState, type CSSProperties, type HTMLAttributes, type PointerEvent } from "react";
import { pointerDefaults, type PointerSpecProps } from "../generated/pointer.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion, useReducedMotion } from "../utils/motion";

export interface PointerProps extends PointerSpecProps, Omit<HTMLAttributes<HTMLDivElement>, keyof PointerSpecProps | "className"> {
  className?: string;
}

/**
 * A named pointer, like a collaborator cursor, that follows the mouse inside its container. The arrow is
 * drawn with CSS. It is decoration for mouse users: aria-hidden, pointer-events none, hidden when the mouse
 * leaves, and absent for touch or pen input, reduced motion, isStill and an enclosing rdm-still.
 */
export const Pointer = forwardRef<HTMLDivElement, PointerProps>(function Pointer(
  { children, name, color, isStill = pointerDefaults.isStill, className, onPointerMove, onPointerLeave, ...rest },
  forwarded,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const mark = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(false);
  const reduced = useReducedMotion();
  const off = isStill || reduced;
  const tint = color ?? "var(--rd-color-action-primary)";

  const move = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const el = root.current;
    if (!el || off || event.pointerType === "touch" || event.pointerType === "pen" || prefersReducedMotion() || el.closest(".rdm-still")) {
      if (shown) setShown(false);
      return;
    }
    const box = el.getBoundingClientRect();
    if (mark.current) mark.current.style.transform = `translate3d(${event.clientX - box.left}px, ${event.clientY - box.top}px, 0)`;
    if (!shown) setShown(true);
  };

  const leave = (event: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    setShown(false);
  };

  const wrapper: CSSProperties = {
    position: "absolute",
    top: 0,
    insetInlineStart: 0,
    pointerEvents: "none",
    zIndex: 50,
    opacity: shown ? 1 : 0,
    transition: "opacity 120ms",
    willChange: "transform",
  };

  return (
    <div
      {...rest}
      ref={(node) => {
        root.current = node;
        if (typeof forwarded === "function") forwarded(node);
        else if (forwarded) forwarded.current = node;
      }}
      onPointerMove={move}
      onPointerLeave={leave}
      className={cx("relative overflow-hidden", className)}
    >
      {children}
      {off ? null : (
        <span ref={mark} aria-hidden="true" data-rdm-pointer="" style={wrapper}>
          {/* Arrow: a triangle cut with clip-path, tip at the top left of the wrapper. */}
          <span
            style={{
              display: "block",
              width: 16,
              height: 20,
              background: tint,
              forcedColorAdjust: "none",
              clipPath: "polygon(0 0, 0 100%, 30% 76%, 52% 100%, 70% 90%, 48% 68%, 100% 62%)",
            }}
          />
          <span
            className="text-xs font-medium"
            style={{
              position: "absolute",
              top: 18,
              insetInlineStart: 12,
              padding: "1px 8px",
              borderRadius: 9999,
              whiteSpace: "nowrap",
              background: tint,
              color: "var(--rd-color-action-on-primary)",
              border: "1px solid transparent",
            }}
          >
            {name}
          </span>
        </span>
      )}
    </div>
  );
});
