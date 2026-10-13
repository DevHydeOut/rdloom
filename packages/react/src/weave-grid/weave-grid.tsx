"use client";

import { forwardRef } from "react";
import { weaveGridDefaults, type WeaveGridSpecProps } from "../generated/weave-grid.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";
import type { PatternDivProps } from "../utils/pattern";

export interface WeaveGridProps extends WeaveGridSpecProps, Omit<PatternDivProps, keyof WeaveGridSpecProps> {}

/**
 * Warp and weft threads crossing, with an ember shuttle that passes through slowly. CSS only.
 * Decoration: hidden from assistive technology, ignores the pointer.
 */
export const WeaveGrid = forwardRef<HTMLDivElement, WeaveGridProps>(function WeaveGrid(
  {
    size = weaveGridDefaults.size,
    warpColor = weaveGridDefaults.warpColor,
    weftColor = weaveGridDefaults.weftColor,
    accent = weaveGridDefaults.accent,
    fade = weaveGridDefaults.fade,
    duration = weaveGridDefaults.duration,
    isStill = weaveGridDefaults.isStill,
    className,
    style,
    ...rest
  },
  ref,
) {
  return (
    <div
      {...rest}
      ref={ref}
      aria-hidden="true"
      data-fade={fade ? "edge" : undefined}
      data-rdm-still={isStill || undefined}
      className={cx("rdm-pattern rdm-weave", className)}
      style={{
        ...style,
        ...motionVars({ "--rdm-wc": warpColor, "--rdm-fc": weftColor, "--rdm-ac": accent, "--rdm-p": `${size}px`, "--rdm-d": `${duration}s` }),
      }}
    >
      <div className="rdm-weave-warp" />
      <div className="rdm-weave-weft" />
      <div className="rdm-weave-shuttle" />
    </div>
  );
});
