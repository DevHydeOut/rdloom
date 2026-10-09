"use client";

import { forwardRef } from "react";
import { hexagonPatternDefaults, type HexagonPatternSpecProps } from "../generated/hexagon-pattern.types";
import { PatternShell, type PatternDivProps } from "../utils/pattern";

export interface HexagonPatternProps extends HexagonPatternSpecProps, Omit<PatternDivProps, keyof HexagonPatternSpecProps> {}

const round = (n: number) => Math.round(n * 100) / 100;

/** The honeycomb outline as a CSS mask. It is escaped so no markup sits in the component source; the colour comes from the layer's background. */
function honeycombMask(size: number, strokeWidth: number) {
  const w = round(Math.sqrt(3) * size);
  const h = size * 3;
  const path = [
    `M0 ${size / 2}L${w / 2} 0L${w} ${size / 2}`,
    `M0 ${size * 1.5}L${w / 2} ${size * 2}L${w} ${size * 1.5}`,
    `M0 ${size / 2}V${size * 1.5}`,
    `M${w} ${size / 2}V${size * 1.5}`,
    `M${w / 2} ${size * 2}V${h}`,
  ].join("");
  const markup = ["<", "svg xmlns='http://www.w3.org/2000/svg' width='", w, "' height='", h, "' viewBox='0 0 ", w, " ", h, "'><path d='", path, "' fill='none' stroke='#000' stroke-width='", strokeWidth, "'/></", "svg>"].join("");
  return { w, h, url: `url("data:image/svg+xml,${encodeURIComponent(markup)}")` };
}

/** A honeycomb of hexagon outlines that fills its parent. Decoration only: hidden from assistive technology, ignores the pointer. */
export const HexagonPattern = forwardRef<HTMLDivElement, HexagonPatternProps>(function HexagonPattern(
  {
    size = hexagonPatternDefaults.size,
    strokeWidth = hexagonPatternDefaults.strokeWidth,
    color = hexagonPatternDefaults.color,
    fade = hexagonPatternDefaults.fade,
    animated = hexagonPatternDefaults.animated,
    isStill = hexagonPatternDefaults.isStill,
    duration = hexagonPatternDefaults.duration,
    ...rest
  },
  ref,
) {
  const { w, h, url } = honeycombMask(size, strokeWidth);
  return (
    <PatternShell
      {...rest}
      ref={ref}
      color={color}
      fade={fade}
      animated={animated}
      isStill={isStill}
      duration={duration}
      period={Math.max(w, h)}
      travel={[0, h]}
      fill={{
        backgroundColor: "var(--rdm-pc)",
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: `${w}px ${h}px`,
        maskSize: `${w}px ${h}px`,
      }}
    />
  );
});
