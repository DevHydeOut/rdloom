"use client";

import { forwardRef, useEffect, useState, type HTMLAttributes } from "react";
import { morphingTextDefaults, type MorphingTextSpecProps } from "../generated/morphing-text.types";
import { cx } from "../utils/cx";
import { motionVars, useReducedMotion } from "../utils/motion";

export interface MorphingTextProps
  extends MorphingTextSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof MorphingTextSpecProps | "className"> {
  className?: string;
}

/**
 * One slot that morphs through a list of phrases: the old one blurs out as the new one blurs in. Every
 * phrase sits in the same grid cell (the others are invisible), so the slot is as wide as the longest
 * and nothing around it moves. The first phrase is in the server HTML; the group is named with all of them.
 */
export const MorphingText = forwardRef<HTMLSpanElement, MorphingTextProps>(function MorphingText(
  {
    texts,
    interval = morphingTextDefaults.interval,
    duration = morphingTextDefaults.duration,
    label,
    isPaused = morphingTextDefaults.isPaused,
    className,
    style,
    ...rest
  },
  ref,
) {
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();
  const still = isPaused || reduced || texts.length < 2;
  const count = texts.length;
  const current = count ? step % count : 0;
  const previous = !still && step > 0 ? (step - 1) % count : -1;

  useEffect(() => {
    if (still) return;
    const timer = setTimeout(() => setStep((s) => s + 1), interval);
    return () => clearTimeout(timer);
  }, [still, interval, count, step]);

  return (
    <span
      {...rest}
      ref={ref}
      role="group"
      aria-label={label ?? texts.join(", ")}
      data-rdm-paused={isPaused || undefined}
      data-rdm-run={(!still && step > 0) || undefined}
      className={cx("rdm-morph", className)}
      style={{ ...motionVars({ "--rdm-d": `${duration}ms` }), ...style }}
    >
      {texts.map((text, i) => (
        <span
          key={i}
          className="rdm-morph-item"
          aria-hidden="true"
          data-morph={i === current ? "in" : i === previous ? "out" : undefined}
        >
          {text}
        </span>
      ))}
    </span>
  );
});
