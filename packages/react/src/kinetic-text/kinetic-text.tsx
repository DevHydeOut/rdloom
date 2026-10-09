"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { kineticTextDefaults, type KineticTextSpecProps } from "../generated/kinetic-text.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";
import { splitWords } from "../utils/split-text";

export interface KineticTextProps
  extends KineticTextSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof KineticTextSpecProps | "className" | "children"> {
  className?: string;
}

/**
 * Letters that move one after another in a loop (wave, bounce or pulse), staggered by position. Plain
 * CSS. The full text is visually hidden for screen readers and the moving letters are hidden from them.
 */
export const KineticText = forwardRef<HTMLSpanElement, KineticTextProps>(function KineticText(
  {
    children,
    effect = kineticTextDefaults.effect,
    duration = kineticTextDefaults.duration,
    stagger = kineticTextDefaults.stagger,
    isPaused = kineticTextDefaults.isPaused,
    className,
    style,
    ...rest
  },
  ref,
) {
  let n = 0;
  const words = splitWords(children);
  return (
    <span
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      data-effect={effect}
      className={cx("rdm-kinetic", className)}
      style={{ ...motionVars({ "--rdm-d": `${duration}s`, "--rdm-s": `${stagger}s` }), ...style }}
    >
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {words.map((word, w) => (
          <span key={w}>
            <span className="rdm-word-nowrap">
              {Array.from(word).map((ch) => {
                const i = n++;
                return (
                  <span key={i} className="rdm-kinetic-unit" style={{ "--rdm-i": i } as CSSProperties}>
                    {ch}
                  </span>
                );
              })}
            </span>
            {w < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </span>
  );
});
