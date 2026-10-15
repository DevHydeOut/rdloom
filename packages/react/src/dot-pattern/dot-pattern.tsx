"use client";

import { forwardRef } from "react";
import { dotPatternDefaults, type DotPatternSpecProps } from "../generated/dot-pattern.types";
import { PatternShell, type PatternDivProps } from "../utils/pattern";

export interface DotPatternProps extends DotPatternSpecProps, Omit<PatternDivProps, keyof DotPatternSpecProps> {}

/** A field of dots that fills its parent. Decoration only: hidden from assistive technology, ignores the pointer. */
export const DotPattern = forwardRef<HTMLDivElement, DotPatternProps>(function DotPattern(
  {
    size = dotPatternDefaults.size,
    gap = dotPatternDefaults.gap,
    color = dotPatternDefaults.color,
    fade = dotPatternDefaults.fade,
    animated = dotPatternDefaults.animated,
    isStill = dotPatternDefaults.isStill,
    duration = dotPatternDefaults.duration,
    ...rest
  },
  ref,
) {
  const tile = size + gap;
  const r = size / 2;
  return (
    <PatternShell
      {...rest}
      ref={ref}
      color={color}
      fade={fade}
      animated={animated}
      isStill={isStill}
      duration={duration}
      period={tile}
      travel={[tile, tile]}
      fill={{
        backgroundImage: `radial-gradient(circle at center, var(--rdm-pc) ${r}px, transparent ${r + 0.5}px)`,
        backgroundSize: `${tile}px ${tile}px`,
      }}
    />
  );
});
