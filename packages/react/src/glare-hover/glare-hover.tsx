import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { glareHoverDefaults, type GlareHoverSpecProps } from "../generated/glare-hover.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";

// Plain markup with no hooks: the sweep is pure CSS on :hover and :focus-within.

export interface GlareHoverProps
  extends GlareHoverSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof GlareHoverSpecProps | "className"> {
  className?: string;
}

/** A band of light that sweeps across its content on hover and on focus. Give it the rounding and size you want. */
export const GlareHover = forwardRef<HTMLDivElement, GlareHoverProps>(function GlareHover(
  { children, angle = glareHoverDefaults.angle, duration = glareHoverDefaults.duration, color, isPaused = glareHoverDefaults.isPaused, className, style, ...rest },
  ref,
) {
  return (
    <div
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-glare relative isolate overflow-hidden", className)}
      style={{ ...(motionVars({ "--rdm-a": `${angle}deg`, "--rdm-d": `${duration}s`, "--rdm-c": color }) as CSSProperties), ...style }}
    >
      {children}
      <span aria-hidden="true" className="rdm-glare-band" />
    </div>
  );
});
