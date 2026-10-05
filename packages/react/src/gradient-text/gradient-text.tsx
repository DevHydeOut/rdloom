import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { gradientTextDefaults, type GradientTextSpecProps } from "../generated/gradient-text.types";
import { cx } from "../utils/cx";
import { MotionStyle } from "../utils/motion";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface GradientTextProps
  extends GradientTextSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof GradientTextSpecProps | "className"> {
  className?: string;
}

const css = `
@keyframes rdm-gradient-text{to{background-position:300% 0}}
.rdm-gradient-text{color:transparent;-webkit-background-clip:text;background-clip:text;background-size:300% 100%;
  animation:rdm-gradient-text var(--rdm-d,6s) linear infinite}
[data-rdm-paused].rdm-gradient-text{animation-play-state:paused}
@media (forced-colors:active){.rdm-gradient-text{color:CanvasText;background:none;animation:none}}
`;

// Each default colour is at least 4.5:1 against the page in light and dark, so the text stays readable
// wherever the gradient is.
const defaultColors = ["var(--rd-color-action-primary)", "var(--rd-color-feedback-warning)", "var(--rd-color-feedback-info)"];

/** Text filled with a gradient that keeps flowing. If you choose your own colours, keep each readable on its own. */
export const GradientText = forwardRef<HTMLSpanElement, GradientTextProps>(function GradientText(
  { children, colors = defaultColors, duration = gradientTextDefaults.duration, isPaused = gradientTextDefaults.isPaused, className, style, ...rest },
  ref,
) {
  const stops = [...colors, colors[0]].join(", ");
  return (
    <>
      <MotionStyle css={css} still={{ ".rdm-gradient-text": `animation:none;background-image:none;color:${colors[0]}` }} />
      <span
        {...rest}
        ref={ref}
        data-rdm-paused={isPaused || undefined}
        className={cx("rdm-gradient-text", className)}
        style={{ backgroundImage: `linear-gradient(90deg, ${stops})`, ...({ "--rdm-d": `${duration}s` } as CSSProperties), ...style }}
      >
        {children}
      </span>
    </>
  );
});
