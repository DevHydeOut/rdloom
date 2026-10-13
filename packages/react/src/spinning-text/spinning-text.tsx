"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { spinningTextDefaults, type SpinningTextSpecProps } from "../generated/spinning-text.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";

export interface SpinningTextProps
  extends SpinningTextSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof SpinningTextSpecProps | "className" | "children"> {
  className?: string;
}

/**
 * Text set on a circle that turns slowly. The layout is CSS only: every letter is rotated by its share
 * of the circle and pushed out by the radius. The real text is a visually hidden copy; the ring is hidden
 * from assistive technology. Reduced motion and isPaused keep the ring still.
 */
export const SpinningText = forwardRef<HTMLSpanElement, SpinningTextProps>(function SpinningText(
  {
    children,
    radius = spinningTextDefaults.radius,
    duration = spinningTextDefaults.duration,
    reverse = spinningTextDefaults.reverse,
    isPaused = spinningTextDefaults.isPaused,
    className,
    style,
    ...rest
  },
  ref,
) {
  const letters = Array.from(children);
  return (
    <span
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-spin", className)}
      style={{ ...motionVars({ "--rdm-r": `${radius}px`, "--rdm-n": letters.length, "--rdm-d": `${duration}s` }), ...style }}
    >
      <span className="sr-only">{children}</span>
      <span className="rdm-spin-ring" aria-hidden="true" data-reverse={reverse || undefined}>
        {letters.map((letter, i) => (
          <span key={i} className="rdm-spin-letter" style={{ "--rdm-i": i } as CSSProperties}>
            {letter}
          </span>
        ))}
      </span>
    </span>
  );
});
