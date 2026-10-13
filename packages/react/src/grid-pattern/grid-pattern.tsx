"use client";

import { forwardRef } from "react";
import { gridPatternDefaults, type GridPatternSpecProps } from "../generated/grid-pattern.types";
import { PatternShell, type PatternDivProps } from "../utils/pattern";

export interface GridPatternProps extends GridPatternSpecProps, Omit<PatternDivProps, keyof GridPatternSpecProps> {}

/** A grid of thin lines that fills its parent. Decoration only: hidden from assistive technology, ignores the pointer. */
export const GridPattern = forwardRef<HTMLDivElement, GridPatternProps>(function GridPattern(
  {
    size = gridPatternDefaults.size,
    strokeWidth = gridPatternDefaults.strokeWidth,
    color = gridPatternDefaults.color,
    fade = gridPatternDefaults.fade,
    animated = gridPatternDefaults.animated,
    isStill = gridPatternDefaults.isStill,
    duration = gridPatternDefaults.duration,
    ...rest
  },
  ref,
) {
  const line = (dir: string) => `linear-gradient(${dir}, var(--rdm-pc) ${strokeWidth}px, transparent ${strokeWidth}px)`;
  return (
    <PatternShell
      {...rest}
      ref={ref}
      color={color}
      fade={fade}
      animated={animated}
      isStill={isStill}
      duration={duration}
      period={size}
      travel={[size, size]}
      fill={{ backgroundImage: `${line("to right")}, ${line("to bottom")}`, backgroundSize: `${size}px ${size}px` }}
    />
  );
});
