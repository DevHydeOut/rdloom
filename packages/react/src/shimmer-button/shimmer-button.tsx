"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "../button/button";
import { shimmerButtonDefaults, type ShimmerButtonSpecProps } from "../generated/shimmer-button.types";
import { cx } from "../utils/cx";
import { MotionStyle, motionVars } from "../utils/motion";

export interface ShimmerButtonProps extends ShimmerButtonSpecProps, Omit<ButtonProps, keyof ShimmerButtonSpecProps> {}

const css = `
@keyframes rdm-shimmer{0%{transform:translateX(-130%) skewX(-18deg)}55%,100%{transform:translateX(330%) skewX(-18deg)}}
.rdm-shimmer{position:absolute;inset:0 auto 0 0;width:38%;pointer-events:none;
  background:linear-gradient(90deg,transparent,color-mix(in srgb,currentColor 34%,transparent),transparent);
  animation:rdm-shimmer var(--rdm-d,2.6s) ease-in-out infinite}
[data-rdm-paused] .rdm-shimmer{animation-play-state:paused}
`;

/** A button whose surface is crossed by a soft band of light, now and then. Builds on Button. */
export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(function ShimmerButton(
  { children, duration = shimmerButtonDefaults.duration, isPaused = shimmerButtonDefaults.isPaused, className, style, ...rest },
  ref,
) {
  return (
    <>
      <MotionStyle css={css} still={{ ".rdm-shimmer": "display:none" }} />
      <Button
        {...rest}
        ref={ref}
        data-rdm-paused={isPaused || undefined}
        className={cx("relative overflow-hidden", className)}
        style={(values) => ({ ...motionVars({ "--rdm-d": `${duration}s` }), ...(typeof style === "function" ? style(values) : style) })}
      >
        <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
        <span aria-hidden="true" className="rdm-shimmer" />
      </Button>
    </>
  );
});
