"use client";

import { forwardRef, useEffect, useState, type CSSProperties } from "react";
import { ProgressBar } from "react-aria-components";
import {
  animatedCircularProgressDefaults,
  type AnimatedCircularProgressSpecProps,
} from "../generated/animated-circular-progress.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "../utils/motion";

export interface AnimatedCircularProgressProps
  extends AnimatedCircularProgressSpecProps {
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

type Phase = "final" | "empty" | "filling";

/**
 * A ring that fills to its value once it is on screen. The value is real text and the ring is
 * already at its final size in the server HTML; only in the browser (and when the visitor has not
 * asked for less motion) is it emptied before the first paint and then filled.
 */
export const AnimatedCircularProgress = forwardRef<HTMLDivElement, AnimatedCircularProgressProps>(
  function AnimatedCircularProgress(
    {
      value = animatedCircularProgressDefaults.value,
      minValue = animatedCircularProgressDefaults.minValue,
      maxValue = animatedCircularProgressDefaults.maxValue,
      label,
      size = animatedCircularProgressDefaults.size,
      thickness = animatedCircularProgressDefaults.thickness,
      showValue = animatedCircularProgressDefaults.showValue,
      isIndeterminate = animatedCircularProgressDefaults.isIndeterminate,
      duration,
      isPaused = animatedCircularProgressDefaults.isPaused,
      children,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const [phase, setPhase] = useState<Phase>("final");

    useIsomorphicLayoutEffect(() => {
      if (prefersReducedMotion() || isIndeterminate) return;
      setPhase("empty");
    }, []);

    useEffect(() => {
      if (phase !== "empty") return;
      const frame = requestAnimationFrame(() => setPhase("filling"));
      return () => cancelAnimationFrame(frame);
    }, [phase]);

    const span = maxValue - minValue;
    const clamped = Math.min(Math.max(value, minValue), maxValue);
    const percent = span > 0 ? ((clamped - minValue) / span) * 100 : 0;
    const shown = isIndeterminate ? 25 : phase === "empty" ? 0 : percent;

    const vars = {
      width: size,
      height: size,
      "--rdm-w": `${thickness}px`,
      "--rdm-pct": shown,
      ...(duration !== undefined ? { "--rdm-d": `${duration}s` } : {}),
    } as CSSProperties;

    return (
      <ProgressBar
        {...rest}
        ref={ref}
        value={clamped}
        minValue={minValue}
        maxValue={maxValue}
        isIndeterminate={isIndeterminate}
        aria-label={label ?? rest["aria-label"]}
        data-rdm-paused={isPaused || undefined}
        className={cx("relative inline-flex items-center justify-center text-[var(--rd-color-text-default)]", className)}
        style={{ ...style, ...vars }}
      >
        {({ valueText }) => (
          <>
            <span
              aria-hidden="true"
              className={cx("rdm-cprogress-ring", isIndeterminate && "rdm-cprogress-spin")}
              style={phase === "empty" ? { transition: "none" } : undefined}
            />
            {children ?? (showValue && !isIndeterminate ? (
              <span className="relative text-sm font-medium tabular-nums">{valueText}</span>
            ) : null)}
          </>
        )}
      </ProgressBar>
    );
  },
);
