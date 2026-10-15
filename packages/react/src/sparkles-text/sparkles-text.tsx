"use client";

import { forwardRef, useEffect, useState, type CSSProperties, type HTMLAttributes } from "react";
import { sparklesTextDefaults, type SparklesTextSpecProps } from "../generated/sparkles-text.types";
import { cx } from "../utils/cx";
import { motionVars, useReducedMotion } from "../utils/motion";

export interface SparklesTextProps
  extends SparklesTextSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof SparklesTextSpecProps | "className" | "children"> {
  className?: string;
}

/** Positions that look scattered but are the same on every render, so nothing differs between server and browser. */
function spot(i: number) {
  const x = (i * 0.618034 + 0.07) % 1;
  const y = (i * 0.381966 * 3 + 0.23) % 1;
  return { x: Math.round(x * 100), y: Math.round(y * 100) };
}

/**
 * Text with small four-point sparkles twinkling around it. The text is real and is in the server HTML;
 * the sparkles are CSS shapes in an aria-hidden layer added after mount. Reduced motion and isPaused
 * show the text with no sparkles.
 */
export const SparklesText = forwardRef<HTMLSpanElement, SparklesTextProps>(function SparklesText(
  { children, count = sparklesTextDefaults.count, color = sparklesTextDefaults.color, isPaused = sparklesTextDefaults.isPaused, className, style, ...rest },
  ref,
) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const n = Math.min(20, Math.max(1, Math.round(count)));

  return (
    <span
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-sparkles", className)}
      style={{ ...motionVars({ "--rdm-c": color }), ...style }}
    >
      {children}
      {mounted && !isPaused && !reduced ? (
        <span aria-hidden="true" className="rdm-sparkles-layer">
          {Array.from({ length: n }, (_, i) => {
            const { x, y } = spot(i + 1);
            return (
              <span
                key={i}
                className="rdm-sparkle"
                style={{ "--rdm-x": `${x}%`, "--rdm-y": `${y}%`, "--rdm-delay": `${((i * 0.37) % 2).toFixed(2)}s`, "--rdm-sz": `${0.3 + (i % 3) * 0.15}em` } as CSSProperties}
              />
            );
          })}
        </span>
      ) : null}
    </span>
  );
});
