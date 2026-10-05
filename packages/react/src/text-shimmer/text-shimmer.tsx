import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { textShimmerDefaults, type TextShimmerSpecProps } from "../generated/text-shimmer.types";
import { cx } from "../utils/cx";
import { MotionStyle } from "../utils/motion";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface TextShimmerProps
  extends TextShimmerSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof TextShimmerSpecProps | "className"> {
  className?: string;
}

const css = `
@keyframes rdm-text-shimmer{from{background-position:120% 0}to{background-position:-120% 0}}
.rdm-text-shimmer{color:transparent;-webkit-background-clip:text;background-clip:text;background-size:250% 100%;
  background-image:linear-gradient(100deg,var(--rdm-base,var(--rd-color-text-muted)) 38%,var(--rdm-hi,var(--rd-color-text-default)) 50%,var(--rdm-base,var(--rd-color-text-muted)) 62%);
  animation:rdm-text-shimmer var(--rdm-d,2.8s) linear infinite}
[data-rdm-paused].rdm-text-shimmer{animation-play-state:paused}
@media (forced-colors:active){.rdm-text-shimmer{color:CanvasText;background:none;animation:none}}
`;

/** Text with a band of light sweeping across it. The words stay real text: selectable and readable. */
export const TextShimmer = forwardRef<HTMLSpanElement, TextShimmerProps>(function TextShimmer(
  { children, duration = textShimmerDefaults.duration, baseColor, highlightColor, isPaused = textShimmerDefaults.isPaused, className, style, ...rest },
  ref,
) {
  const vars: Record<string, string> = { "--rdm-d": `${duration}s` };
  if (baseColor) vars["--rdm-base"] = baseColor;
  if (highlightColor) vars["--rdm-hi"] = highlightColor;
  return (
    <>
      <MotionStyle css={css} still={{ ".rdm-text-shimmer": "animation:none;background:none;color:var(--rdm-base,var(--rd-color-text-default))" }} />
      <span
        {...rest}
        ref={ref}
        data-rdm-paused={isPaused || undefined}
        className={cx("rdm-text-shimmer", className)}
        style={{ ...(vars as CSSProperties), ...style }}
      >
        {children}
      </span>
    </>
  );
});
