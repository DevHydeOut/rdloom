"use client";

import { forwardRef } from "react";
import { lightRaysDefaults, type LightRaysSpecProps } from "../generated/light-rays.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";
import type { PatternDivProps } from "../utils/pattern";

export interface LightRaysProps extends LightRaysSpecProps, Omit<PatternDivProps, keyof LightRaysSpecProps> {}

/** Soft angled rays of light that sweep slowly. CSS only. Decoration: hidden from assistive technology, ignores the pointer. */
export const LightRays = forwardRef<HTMLDivElement, LightRaysProps>(function LightRays(
  {
    color = lightRaysDefaults.color,
    angle = lightRaysDefaults.angle,
    duration = lightRaysDefaults.duration,
    isStill = lightRaysDefaults.isStill,
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
      className={cx("rdm-pattern rdm-rays-root", className)}
      style={{ ...style, ...motionVars({ "--rdm-pc": color, "--rdm-ang": `${angle}deg`, "--rdm-d": `${duration}s` }) }}
    >
      <div className="rdm-rays" />
    </div>
  );
});
