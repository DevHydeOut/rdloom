"use client";

import { forwardRef } from "react";
import { stripedPatternDefaults, type StripedPatternSpecProps } from "../generated/striped-pattern.types";
import { PatternShell, type PatternDivProps } from "../utils/pattern";

export interface StripedPatternProps extends StripedPatternSpecProps, Omit<PatternDivProps, keyof StripedPatternSpecProps> {}

/** Diagonal stripes that fill their parent. Decoration only: hidden from assistive technology, ignores the pointer. */
export const StripedPattern = forwardRef<HTMLDivElement, StripedPatternProps>(function StripedPattern(
  {
    size = stripedPatternDefaults.size,
    gap = stripedPatternDefaults.gap,
    angle = stripedPatternDefaults.angle,
    color = stripedPatternDefaults.color,
    fade = stripedPatternDefaults.fade,
    animated = stripedPatternDefaults.animated,
    isStill = stripedPatternDefaults.isStill,
    duration = stripedPatternDefaults.duration,
    ...rest
  },
  ref,
) {
  const period = size + gap;
  const rad = (angle * Math.PI) / 180;
  // Moving one period along the gradient direction repeats the stripes exactly, so the loop has no jump.
  const travel: [number, number] = [Math.round(Math.sin(rad) * period * 100) / 100, Math.round(-Math.cos(rad) * period * 100) / 100];
  return (
    <PatternShell
      {...rest}
      ref={ref}
      color={color}
      fade={fade}
      animated={animated}
      isStill={isStill}
      duration={duration}
      period={period}
      travel={travel}
      fill={{ backgroundImage: `repeating-linear-gradient(${angle}deg, var(--rdm-pc) 0 ${size}px, transparent ${size}px ${period}px)` }}
    />
  );
});
