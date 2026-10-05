import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { rippleDefaults, type RippleSpecProps } from "../generated/ripple.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface RippleProps extends RippleSpecProps, Omit<HTMLAttributes<HTMLDivElement>, keyof RippleSpecProps | "className"> {
  className?: string;
}

/** Concentric rings that swell outward from the centre, as a calm backdrop. Content goes in front of them. */
export const Ripple = forwardRef<HTMLDivElement, RippleProps>(function Ripple(
  { children, size = rippleDefaults.size, rings = rippleDefaults.rings, duration = rippleDefaults.duration, color, isPaused = rippleDefaults.isPaused, className, style, ...rest },
  ref,
) {
  const count = Math.max(1, Math.min(12, Math.round(rings)));
  return (
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
  );
});
