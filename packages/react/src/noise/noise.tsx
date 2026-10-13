"use client";

import { forwardRef } from "react";
import { noiseDefaults, type NoiseSpecProps } from "../generated/noise.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";
import type { PatternDivProps } from "../utils/pattern";

export interface NoiseProps extends NoiseSpecProps, Omit<PatternDivProps, keyof NoiseSpecProps> {}

/** A fine grain laid over its parent. Still unless you ask. Decoration: hidden from assistive technology, ignores the pointer. */
export const Noise = forwardRef<HTMLDivElement, NoiseProps>(function Noise(
  {
    opacity = noiseDefaults.opacity,
    size = noiseDefaults.size,
    animated = noiseDefaults.animated,
    isStill = noiseDefaults.isStill,
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
      data-animated={animated || undefined}
      data-rdm-still={isStill || undefined}
      className={cx("rdm-pattern rdm-noise", className)}
      style={{ ...style, ...motionVars({ "--rdm-op": opacity, "--rdm-p": `${size}px` }) }}
    />
  );
});
