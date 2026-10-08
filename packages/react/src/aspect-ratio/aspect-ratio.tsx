"use client";

import { forwardRef } from "react";
import { aspectRatioDefaults, type AspectRatioSpecProps } from "../generated/aspect-ratio.types";
import { cx } from "../utils/cx";

export interface AspectRatioProps
  extends AspectRatioSpecProps,
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof AspectRatioSpecProps | "className"> {
  className?: string;
}

const presets = {
  square: "1 / 1",
  video: "16 / 9",
  photo: "3 / 2",
  wide: "21 / 9",
  portrait: "3 / 4",
} as const;

function toCss(ratio: AspectRatioSpecProps["ratio"]): string {
  if (typeof ratio === "number") return ratio > 0 ? String(ratio) : presets.video;
  if (ratio && ratio in presets) return presets[ratio as keyof typeof presets];
  if (typeof ratio === "string") {
    const [w, h] = ratio.split("/").map((n) => Number(n.trim()));
    if (w > 0 && h > 0) return `${w} / ${h}`;
  }
  return presets.video;
}

/** Keeps its content at a fixed width to height ratio. Images, video and iframes inside fill the box. */
export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio = aspectRatioDefaults.ratio, rounded = aspectRatioDefaults.rounded, children, className, style, ...rest },
  ref,
) {
  return (
    <div
      {...rest}
      ref={ref}
      style={{ aspectRatio: toCss(ratio), ...style }}
      className={cx(
        "relative w-full overflow-hidden " +
          "[&>img]:size-full [&>img]:object-cover [&>video]:size-full [&>video]:object-cover [&>iframe]:size-full [&>iframe]:border-0 " +
          "[&>svg]:size-full [&>canvas]:size-full",
        rounded && "rounded-[var(--rd-radius-control)]",
        className,
      )}
    >
      {children}
    </div>
  );
});
