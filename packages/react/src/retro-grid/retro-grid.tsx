"use client";

import { forwardRef } from "react";
import { retroGridDefaults, type RetroGridSpecProps } from "../generated/retro-grid.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";
import type { PatternDivProps } from "../utils/pattern";

export interface RetroGridProps extends RetroGridSpecProps, Omit<PatternDivProps, keyof RetroGridSpecProps> {}

/** A perspective floor grid that scrolls toward the viewer. CSS only. Decoration: hidden from assistive technology, ignores the pointer. */
export const RetroGrid = forwardRef<HTMLDivElement, RetroGridProps>(function RetroGrid(
  {
    angle = retroGridDefaults.angle,
    cellSize = retroGridDefaults.cellSize,
    color = retroGridDefaults.color,
    duration = retroGridDefaults.duration,
    isStill = retroGridDefaults.isStill,
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
      data-rdm-still={isStill || undefined}
      className={cx("rdm-pattern rdm-retro", className)}
      style={{ ...style, ...motionVars({ "--rdm-pc": color, "--rdm-p": `${cellSize}px`, "--rdm-ang": `${angle}deg`, "--rdm-d": `${duration}s` }) }}
    >
      <div className="rdm-retro-floor">
        <div className="rdm-retro-grid" />
      </div>
    </div>
  );
});
