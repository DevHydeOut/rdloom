import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { rippleDefaults, type RippleSpecProps } from "../generated/ripple.types";
import { cx } from "../utils/cx";
import { MotionStyle } from "../utils/motion";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface RippleProps extends RippleSpecProps, Omit<HTMLAttributes<HTMLDivElement>, keyof RippleSpecProps | "className"> {
  className?: string;
}

const css = `
@keyframes rdm-ring{0%{transform:translate(-50%,-50%) scale(.86);opacity:.9}
  50%{transform:translate(-50%,-50%) scale(1);opacity:.45}
  100%{transform:translate(-50%,-50%) scale(.86);opacity:.9}}
.rdm-ring{position:absolute;left:50%;top:50%;border-radius:9999px;pointer-events:none;
  border:1px solid color-mix(in srgb,var(--rdm-c,var(--rd-color-border-strong)) 70%,transparent);
  background:color-mix(in srgb,var(--rdm-c,var(--rd-color-border-strong)) 7%,transparent);
  animation:rdm-ring var(--rdm-d,4s) ease-in-out infinite}
[data-rdm-paused] .rdm-ring{animation-play-state:paused}
`;

/** Concentric rings that swell outward from the centre, as a calm backdrop. Content goes in front of them. */
export const Ripple = forwardRef<HTMLDivElement, RippleProps>(function Ripple(
  { children, size = rippleDefaults.size, rings = rippleDefaults.rings, duration = rippleDefaults.duration, color, isPaused = rippleDefaults.isPaused, className, style, ...rest },
  ref,
) {
  const count = Math.max(1, Math.min(12, Math.round(rings)));
  return (
    <>
      <MotionStyle css={css} still={{ ".rdm-ring": "animation:none;opacity:.5" }} />
      <div
        {...rest}
        ref={ref}
        data-rdm-paused={isPaused || undefined}
        className={cx("relative isolate flex items-center justify-center overflow-hidden", className)}
        style={{ ...({ "--rdm-d": `${duration}s`, ...(color ? { "--rdm-c": color } : {}) } as CSSProperties), ...style }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className="rdm-ring"
              style={{ width: size + i * 70, height: size + i * 70, animationDelay: `${i * 0.18}s`, opacity: Math.max(0.15, 0.9 - i * 0.12) }}
            />
          ))}
        </div>
        {children}
      </div>
    </>
  );
});
