import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { skeletonDefaults, type SkeletonSpecProps } from "../generated/skeleton.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface SkeletonProps
  extends SkeletonSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof SkeletonSpecProps | "className" | "children"> {
  className?: string;
}

const block = "animate-pulse bg-[var(--rd-color-surface-subtle)] motion-reduce:animate-none";

const size = (value: string | number | undefined) => (typeof value === "number" ? `${value}px` : value);

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { variant = skeletonDefaults.variant, width, height, lines = skeletonDefaults.lines, className, style, ...rest },
  ref,
) {
  // Nothing to read: a loading region should say so itself (aria-busy and a status message).
  const common = { ...rest, ref, "aria-hidden": true as const };

  if (variant === "text") {
    const count = Math.max(1, Math.round(lines));
    return (
      <div {...common} className={cx("flex flex-col gap-2", className)} style={{ width: size(width) ?? "100%", ...style }}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={cx(block, "rounded-[var(--rd-radius-control)]")}
            // A paragraph's last line stops short.
            style={{ height: size(height) ?? "1em", width: count > 1 && i === count - 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
    );
  }

  const shape: CSSProperties =
    variant === "circle"
      ? { width: size(width) ?? size(height) ?? 40, height: size(height) ?? size(width) ?? 40 }
      : { width: size(width) ?? "100%", height: size(height) ?? 96 };
  return (
    <div
      {...common}
      className={cx(block, variant === "circle" ? "rounded-full" : "rounded-[var(--rd-radius-control)]", className)}
      style={{ ...shape, ...style }}
    />
  );
});
