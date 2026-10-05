import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { shineBorderDefaults, type ShineBorderSpecProps } from "../generated/shine-border.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface ShineBorderProps
  extends ShineBorderSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ShineBorderSpecProps | "className"> {
  className?: string;
}

const defaultColors = ["var(--rd-color-action-primary)", "var(--rd-color-feedback-warning)", "var(--rd-color-feedback-info)"];

/** A band of colour that slides steadily along the border, so the edge seems to catch the light. */
export const ShineBorder = forwardRef<HTMLDivElement, ShineBorderProps>(function ShineBorder(
  {
    children,
    colors = defaultColors,
    duration = shineBorderDefaults.duration,
    borderWidth = shineBorderDefaults.borderWidth,
    isPaused = shineBorderDefaults.isPaused,
    className,
    style,
    ...rest
  },
  ref,
) {
  const stops = [...colors, colors[0]].join(", ");
  return (
    <div
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("relative rounded-[var(--rd-radius-overlay)]", className)}
      style={{ ...({ "--rdm-d": `${duration}s`, "--rdm-w": `${borderWidth}px` } as CSSProperties), ...style }}
    >
      <span aria-hidden="true" className="rdm-shine" style={{ backgroundImage: `linear-gradient(115deg, ${stops})` }} />
      {children}
    </div>
  );
});
