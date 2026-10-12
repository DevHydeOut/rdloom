import { Children, forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { orbitingCirclesDefaults, type OrbitingCirclesSpecProps } from "../generated/orbiting-circles.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component. The positions are
// static transforms, so the server HTML already shows the items evenly spaced; CSS then turns them.

export interface OrbitingCirclesProps
  extends OrbitingCirclesSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof OrbitingCirclesSpecProps | "className"> {
  className?: string;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Children travelling around a centre on one or more circular paths. The items are real list items
 * in a fixed order, the paths are aria-hidden decoration, and the orbit is CSS only.
 */
export const OrbitingCircles = forwardRef<HTMLDivElement, OrbitingCirclesProps>(function OrbitingCircles(
  {
    children,
    center,
    radius = orbitingCirclesDefaults.radius,
    rings = orbitingCirclesDefaults.rings,
    duration = orbitingCirclesDefaults.duration,
    iconSize = orbitingCirclesDefaults.iconSize,
    reverse = orbitingCirclesDefaults.reverse,
    showPaths = orbitingCirclesDefaults.showPaths,
    pauseOnHover = orbitingCirclesDefaults.pauseOnHover,
    label = orbitingCirclesDefaults.label,
    isPaused = orbitingCirclesDefaults.isPaused,
    className,
    style,
    ...rest
  },
  ref,
) {
  const items = Children.toArray(children);
  const count = Math.max(1, Math.min(6, Math.round(rings)));
  const side = round(radius * 2 + iconSize);
  const ringRadius = (k: number) => round((radius * (k + 1)) / count);
  const ringSeconds = (k: number) => round((duration * (k + 1)) / count);
  const reversed = (k: number) => ((count - 1 - k) % 2 === 1) !== reverse;
  const perRing = Array.from({ length: count }, (_, k) => items.filter((_, i) => i % count === k).length);
  const placed = new Array<number>(count).fill(0);

  const vars = { "--rdm-s": `${iconSize}px`, width: side, height: side } as CSSProperties;

  return (
    <div
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      data-pause-hover={pauseOnHover || undefined}
      className={cx("rdm-orbit", className)}
      style={{ ...vars, ...style }}
    >
      {showPaths
        ? Array.from({ length: count }, (_, k) => (
            <span
              key={k}
              aria-hidden="true"
              className="rdm-orbit-path"
              style={{ width: ringRadius(k) * 2, height: ringRadius(k) * 2 }}
            />
          ))
        : null}
      {center ? <div className="rdm-orbit-center">{center}</div> : null}
      <ul role="list" aria-label={label} className="rdm-orbit-list">
        {items.map((child, i) => {
          const k = i % count;
          const index = placed[k]++;
          const angle = round((index / perRing[k]) * 360 + k * 30);
          return (
            <li
              key={(child as { key?: string | number | null }).key ?? i}
              className="rdm-orbit-item"
              data-reverse={reversed(k) || undefined}
              style={
                {
                  "--rdm-a": `${angle}deg`,
                  "--rdm-r": `${ringRadius(k)}px`,
                  "--rdm-d": `${ringSeconds(k)}s`,
                } as CSSProperties
              }
            >
              {child}
            </li>
          );
        })}
      </ul>
    </div>
  );
});
