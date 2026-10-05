import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { shuttleBorderDefaults, type ShuttleBorderSpecProps } from "../generated/shuttle-border.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface ShuttleBorderProps
  extends ShuttleBorderSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ShuttleBorderSpecProps | "className"> {
  className?: string;
}

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
  );
});
