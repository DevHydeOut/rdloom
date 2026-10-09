import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { meteorsDefaults, type MeteorsSpecProps } from "../generated/meteors.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";

// Plain markup with no hooks. Positions come from the index, not Math.random, so the server and the
// browser render the same thing.

export interface MeteorsProps
  extends MeteorsSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof MeteorsSpecProps | "className"> {
  className?: string;
}

const MAX = 60;
const spread = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Streaks falling across a container. Place it behind content in a position: relative parent. */
export const Meteors = forwardRef<HTMLDivElement, MeteorsProps>(function Meteors(
  { count = meteorsDefaults.count, angle = meteorsDefaults.angle, color, duration = meteorsDefaults.duration, isPaused = meteorsDefaults.isPaused, className, style, ...rest },
  ref,
) {
  const n = Math.max(0, Math.min(Math.round(count), MAX));
  return (
    <div
      {...rest}
      ref={ref}
      aria-hidden="true"
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-meteors", className)}
      style={{ ...(motionVars({ "--rdm-a": `${angle}deg`, "--rdm-c": color }) as CSSProperties), ...style }}
    >
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className="rdm-meteor"
          style={
            {
              left: `${Math.round(spread(i, 1) * 100)}%`,
              top: `${Math.round(spread(i, 2) * 60) - 20}%`,
              "--rdm-delay": `${(spread(i, 3) * duration).toFixed(2)}s`,
              "--rdm-d": `${(duration * (0.6 + spread(i, 4) * 0.8)).toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
});
