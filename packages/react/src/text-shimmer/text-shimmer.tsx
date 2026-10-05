import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { textShimmerDefaults, type TextShimmerSpecProps } from "../generated/text-shimmer.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface TextShimmerProps
  extends TextShimmerSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof TextShimmerSpecProps | "className"> {
  className?: string;
}

/** Text with a band of light sweeping across it. The words stay real text: selectable and readable. */
export const TextShimmer = forwardRef<HTMLSpanElement, TextShimmerProps>(function TextShimmer(
  { children, duration = textShimmerDefaults.duration, baseColor, highlightColor, isPaused = textShimmerDefaults.isPaused, className, style, ...rest },
  ref,
) {
  const vars: Record<string, string> = { "--rdm-d": `${duration}s` };
  if (baseColor) vars["--rdm-base"] = baseColor;
  if (highlightColor) vars["--rdm-hi"] = highlightColor;
  return (
    <span
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-text-shimmer", className)}
      style={{ ...(vars as CSSProperties), ...style }}
    >
      {children}
    </span>
  );
});
