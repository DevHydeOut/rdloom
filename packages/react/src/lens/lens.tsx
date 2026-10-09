"use client";

import { forwardRef, useRef, useState, version, type HTMLAttributes, type PointerEvent } from "react";
import { lensDefaults, type LensSpecProps } from "../generated/lens.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion } from "../utils/motion";

// React 19 takes inert as a boolean, React 18 only as an attribute string.
const inertProps = (Number(version.split(".")[0]) >= 19 ? { inert: true } : { inert: "" }) as Record<string, unknown>;

export interface LensProps extends LensSpecProps, Omit<HTMLAttributes<HTMLDivElement>, keyof LensSpecProps | "className"> {
  className?: string;
}

interface Spot {
  x: number;
  y: number;
}

/**
 * A magnifier that follows the mouse over its child. The child stays where it is, untouched and fully
 * accessible. While the pointer is over it, a second, enlarged copy is drawn inside a circle at the
 * pointer; that copy is aria-hidden and inert, and does not exist before the pointer arrives. Touch,
 * reduced motion, isStill and an enclosing rdm-still all switch it off.
 */
export const Lens = forwardRef<HTMLDivElement, LensProps>(function Lens(
  { children, zoom = lensDefaults.zoom, size = lensDefaults.size, isStill = lensDefaults.isStill, className, onPointerMove, onPointerLeave, ...rest },
  forwarded,
) {
  const inner = useRef<HTMLDivElement | null>(null);
  const [spot, setSpot] = useState<Spot | null>(null);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const el = inner.current;
    if (!el || isStill || event.pointerType === "touch" || prefersReducedMotion() || el.closest(".rdm-still")) {
      if (spot) setSpot(null);
      return;
    }
    const box = el.getBoundingClientRect();
    setSpot({ x: event.clientX - box.left, y: event.clientY - box.top });
  };

  const leave = (event: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    setSpot(null);
  };

  return (
    <div
      {...rest}
      ref={(node) => {
        inner.current = node;
        if (typeof forwarded === "function") forwarded(node);
        else if (forwarded) forwarded.current = node;
      }}
      onPointerMove={move}
      onPointerLeave={leave}
      className={cx("rdm-lens relative block w-fit max-w-full overflow-hidden", className)}
    >
      {children}
      {spot ? (
        <>
          <div aria-hidden="true" {...inertProps} className="rdm-lens-layer" style={{ clipPath: `circle(${size / 2}px at ${spot.x}px ${spot.y}px)` }}>
            <div style={{ width: "100%", height: "100%", transformOrigin: `${spot.x}px ${spot.y}px`, transform: `scale(${zoom})` }}>{children}</div>
          </div>
          <div
            aria-hidden="true"
            className="rdm-lens-ring"
            style={{ width: size, height: size, left: spot.x - size / 2, top: spot.y - size / 2 }}
          />
        </>
      ) : null}
    </div>
  );
});
