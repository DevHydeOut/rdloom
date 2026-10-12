"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { Button, Link } from "react-aria-components";
import { iconCloudDefaults, type IconCloudSpecProps } from "../generated/icon-cloud.types";
import { cx } from "../utils/cx";

export interface IconCloudProps
  extends IconCloudSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof IconCloudSpecProps | "className"> {
  className?: string;
}

const focusRing =
  "rounded-[var(--rd-radius-control)] outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

const round = (n: number) => Math.round(n * 100) / 100;

/** Points spread evenly over a sphere (golden angle), as latitude and longitude in degrees. */
function spherePoint(i: number, n: number) {
  const y = n === 1 ? 0 : 1 - (2 * i) / (n - 1);
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = ((i * Math.PI * (3 - Math.sqrt(5))) * 180) / Math.PI;
  return { lat: round(lat), lon: round(lon % 360) };
}

/**
 * Icons on a slowly turning sphere made with CSS 3D transforms. The list keeps one DOM order, the
 * icons are links, buttons or plain images, and the turning pauses on hover and focus.
 */
export const IconCloud = forwardRef<HTMLDivElement, IconCloudProps>(function IconCloud(
  {
    items,
    size = iconCloudDefaults.size,
    iconSize = iconCloudDefaults.iconSize,
    duration = iconCloudDefaults.duration,
    label = iconCloudDefaults.label,
    isPaused = iconCloudDefaults.isPaused,
    className,
    style,
    ...rest
  },
  ref,
) {
  const vars = {
    width: size,
    height: size,
    "--rdm-s": `${iconSize}px`,
    "--rdm-rad": `${round(size / 2 - iconSize / 2)}px`,
    "--rdm-d": `${duration}s`,
    perspective: `${round(size * 2.4)}px`,
  } as CSSProperties;

  return (
    <div
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-cloud", className)}
      style={{ ...vars, ...style }}
    >
      <ul role="list" aria-label={label} className="rdm-cloud-sphere">
        {items.map((item, i) => {
          const { lat, lon } = spherePoint(i, items.length);
          const icon = item.href ? (
            <Link href={item.href} aria-label={item.label} className={cx("rdm-cloud-icon", focusRing)}>
              {item.icon}
            </Link>
          ) : item.onPress ? (
            <Button onPress={item.onPress} aria-label={item.label} className={cx("rdm-cloud-icon", focusRing)}>
              {item.icon}
            </Button>
          ) : (
            <span role="img" aria-label={item.label} className="rdm-cloud-icon">
              {item.icon}
            </span>
          );
          return (
            <li
              key={item.id ?? `${item.label}-${i}`}
              className="rdm-cloud-item"
              style={{ "--rdm-lat": `${lat}deg`, "--rdm-lon": `${lon}deg` } as CSSProperties}
            >
              <span className="rdm-cloud-face">{icon}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
