import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { shuttleBorderDefaults, type ShuttleBorderSpecProps } from "../generated/shuttle-border.types";
import { cx } from "../utils/cx";
import { MotionStyle } from "../utils/motion";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface ShuttleBorderProps
  extends ShuttleBorderSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ShuttleBorderSpecProps | "className"> {
  className?: string;
}

const css = `
@property --rdm-angle{syntax:"<angle>";inherits:false;initial-value:0deg}
@keyframes rdm-spin{to{--rdm-angle:360deg}}
.rdm-shuttle{position:absolute;inset:0;border-radius:inherit;padding:var(--rdm-w,1.5px);pointer-events:none;
  background:conic-gradient(from var(--rdm-angle),transparent 0,transparent 70%,var(--rdm-c,var(--rd-color-action-primary)) 90%,transparent 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
  animation:rdm-spin var(--rdm-d,4s) linear infinite}
[data-rdm-paused]>.rdm-shuttle{animation-play-state:paused}
`;

/**
 * A point of light that runs around the edge of whatever is inside, like the shuttle of a loom
 * crossing the threads. Give it the radius and background you want through className.
 */
export const ShuttleBorder = forwardRef<HTMLDivElement, ShuttleBorderProps>(function ShuttleBorder(
  {
    children,
    color,
    duration = shuttleBorderDefaults.duration,
    borderWidth = shuttleBorderDefaults.borderWidth,
    isPaused = shuttleBorderDefaults.isPaused,
    className,
    style,
    ...rest
  },
  ref,
) {
  const vars: Record<string, string | number> = { "--rdm-d": `${duration}s`, "--rdm-w": `${borderWidth}px` };
  if (color) vars["--rdm-c"] = color;
  return (
    <>
      <MotionStyle css={css} still={{ ".rdm-shuttle": "animation:none;background:none" }} />
      <div
        {...rest}
        ref={ref}
        data-rdm-paused={isPaused || undefined}
        className={cx("relative rounded-[var(--rd-radius-overlay)]", className)}
        style={{ ...(vars as CSSProperties), ...style }}
      >
        <span aria-hidden="true" className="rdm-shuttle" />
        {children}
      </div>
    </>
  );
});
