"use client";

import { forwardRef, useEffect, useState, type HTMLAttributes } from "react";
import { wordRotateDefaults, type WordRotateSpecProps } from "../generated/word-rotate.types";
import { cx } from "../utils/cx";
import { motionVars, useReducedMotion } from "../utils/motion";

export interface WordRotateProps
  extends WordRotateSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof WordRotateSpecProps | "className"> {
  className?: string;
}

/**
 * One slot that cycles through a list of words. Every word is laid over the same cell (the others are
 * invisible) so the slot is as wide as the longest word and nothing around it moves. The first word is
 * in the server HTML. Reduced motion and isPaused hold the current word.
 */
export const WordRotate = forwardRef<HTMLSpanElement, WordRotateProps>(function WordRotate(
  {
    words,
    duration = wordRotateDefaults.duration,
    announce = wordRotateDefaults.announce,
    label,
    isPaused = wordRotateDefaults.isPaused,
    className,
    style,
    ...rest
  },
  ref,
) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const still = isPaused || reduced || words.length < 2;
  const current = words.length ? index % words.length : 0;

  useEffect(() => {
    if (still) return;
    const timer = setTimeout(() => setIndex((i) => i + 1), duration);
    return () => clearTimeout(timer);
  }, [still, duration, words.length, index]);

  const live = announce ? ({ role: "status", "aria-live": "polite", "aria-atomic": true } as const) : ({ role: "group", "aria-label": label ?? words.join(", ") } as const);

  return (
    <span
      {...rest}
      {...live}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      data-rdm-run={index > 0 || undefined}
      className={cx("rdm-word-rotate", className)}
      style={{ ...motionVars({ "--rdm-d": `${Math.min(duration, 500)}ms` }), ...style }}
    >
      {words.map((word, i) => {
        const isCurrent = i === current;
        return (
          <span
            key={isCurrent ? `${word}-${index}` : `${word}-${i}`}
            className="rdm-word-item"
            data-current={isCurrent || undefined}
            aria-hidden={announce && isCurrent ? undefined : true}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
});
