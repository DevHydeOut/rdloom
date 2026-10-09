"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { cx } from "./cx";

/** Props every background pattern shares. */
export interface PatternBaseProps {
  /** Any CSS colour or token, for example var(--rd-color-border-default). */
  color?: string;
  /** Fades the pattern out toward its edges. */
  fade?: boolean;
  /** Slowly drifts the pattern by one tile per cycle. */
  animated?: boolean;
  /** Stops the drift. */
  isStill?: boolean;
  /** Seconds one drift cycle takes. */
  duration?: number;
}

export type PatternDivProps = Omit<HTMLAttributes<HTMLDivElement>, "className" | "color" | "children"> & { className?: string };

interface ShellProps extends PatternBaseProps {
  /** Style of the pattern layer itself: background, mask and sizes. */
  fill: CSSProperties;
  /** Tile size in px, used to loop the drift without a jump. */
  period: number;
  /** Drift vector for one cycle in px. */
  travel: [number, number];
}

/**
 * The shared frame of the background patterns: a decoration layer that fills its parent, ignores the
 * pointer, is hidden from assistive technology and stands still for reduced motion and isStill.
 */
export const PatternShell = forwardRef<HTMLDivElement, ShellProps & PatternDivProps>(function PatternShell(
  { color, fade, animated, isStill, duration, fill, period, travel, className, style, ...rest },
  ref,
) {
  const vars = {
    "--rdm-pc": color,
    "--rdm-p": `${period}px`,
    "--rdm-tx": `${travel[0]}px`,
    "--rdm-ty": `${travel[1]}px`,
    "--rdm-d": duration ? `${duration}s` : undefined,
  } as CSSProperties;
  return (
    <div
      {...rest}
      ref={ref}
      aria-hidden="true"
      data-fade={fade ? "edge" : undefined}
      data-animated={animated || undefined}
      data-rdm-still={isStill || undefined}
      className={cx("rdm-pattern", className)}
      style={{ ...style, ...vars }}
    >
      <div className="rdm-pattern-fill" style={fill} />
    </div>
  );
});
