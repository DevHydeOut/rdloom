import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { selvedgeBlurDefaults, type SelvedgeBlurSpecProps } from "../generated/selvedge-blur.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface SelvedgeBlurProps
  extends SelvedgeBlurSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof SelvedgeBlurSpecProps | "className" | "children"> {
  className?: string;
}

const placement = {
  top: "inset-x-0 top-0",
  bottom: "inset-x-0 bottom-0",
  start: "inset-y-0 start-0",
  end: "inset-y-0 end-0",
} as const;

/**
 * A progressive blur along one edge of the parent: stacked backdrop-blur layers, each masked so the
 * blur grows toward the edge. Decoration only: hidden from assistive technology, ignores the pointer.
 * Put it inside a position: relative parent, after the content it softens.
 */
export const SelvedgeBlur = forwardRef<HTMLDivElement, SelvedgeBlurProps>(function SelvedgeBlur(
  {
    position = selvedgeBlurDefaults.position,
    strength = selvedgeBlurDefaults.strength,
    size = selvedgeBlurDefaults.size,
    layers = selvedgeBlurDefaults.layers,
    className,
    style,
    ...rest
  },
  ref,
) {
  const count = Math.max(2, Math.min(12, Math.round(layers)));
  const vertical = position === "top" || position === "bottom";
  const box: CSSProperties = vertical ? { height: size } : { width: size };
  return (
    <div
      {...rest}
      ref={ref}
      aria-hidden="true"
      data-position={position}
      className={cx("rdm-selvedge pointer-events-none absolute z-10", placement[position], className)}
      style={{ ...box, ...style }}
    >
      {Array.from({ length: count }, (_, i) => {
        // Layer 0 is the lightest blur and reaches furthest in; the last is the strongest, at the edge only.
        const blur = Math.max(0.1, strength * Math.pow(2, i - (count - 1)));
        const outer = ((count - i) / count) * 100;
        const inner = ((count - i - 1) / count) * 100;
        const mask = `linear-gradient(var(--rdm-sdir), #000 ${inner}%, transparent ${outer}%)`;
        return (
          <div
            key={i}
            className="rdm-selvedge-layer"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
});
