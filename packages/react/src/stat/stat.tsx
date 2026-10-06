import { forwardRef, type HTMLAttributes } from "react";
import { statDefaults, type StatSpecProps } from "../generated/stat.types";
import { Skeleton } from "../skeleton/skeleton";
import { Sparkline } from "../sparkline/sparkline";
import { cx } from "../utils/cx";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "../utils/icons";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface StatProps
  extends StatSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof StatSpecProps | "className" | "children"> {
  className?: string;
}

const valueSizes: Record<NonNullable<StatSpecProps["size"]>, string> = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-4xl",
};
const unitSizes: Record<NonNullable<StatSpecProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};
const skeletonHeights: Record<NonNullable<StatSpecProps["size"]>, number> = { sm: 24, md: 32, lg: 40 };

const tints = {
  good: "bg-[var(--rd-color-feedback-success-subtle)] border-transparent",
  bad: "bg-[var(--rd-color-feedback-danger-subtle)] border-transparent",
  neutral: "bg-[var(--rd-color-surface-subtle)] border-[var(--rd-color-border-default)]",
};

const sparkColors = { good: "success", bad: "danger", neutral: "muted" } as const;

export const Stat = forwardRef<HTMLDivElement, StatProps>(function Stat(
  {
    label,
    value,
    format,
    unit,
    trend,
    data,
    description,
    size = statDefaults.size,
    isLoading = statDefaults.isLoading,
    className,
    ...rest
  },
  ref,
) {
  const root = cx("flex min-w-0 flex-col gap-1", className);

  if (isLoading) {
    return (
      <div {...rest} ref={ref} aria-busy="true" className={root}>
        <span className="sr-only">Loading {label}</span>
        <Skeleton variant="text" width={96} height={14} />
        <Skeleton variant="rect" width={128} height={skeletonHeights[size]} />
      </div>
    );
  }

  const valueText = typeof value === "number" ? (format ? format(value) : value.toLocaleString()) : value;

  // The change is a signed percentage: its sign picks the arrow and the word.
  const change = trend?.change ?? 0;
  const dir = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const goodWhen = trend?.goodWhen ?? "up";
  const tone = dir === "flat" ? "neutral" : dir === goodWhen ? "good" : "bad";
  const amount = Math.abs(change).toLocaleString();
  const words = dir === "up" ? "Up" : dir === "down" ? "Down" : "No change";
  const shown = dir === "flat" ? "0%" : `${dir === "up" ? "+" : "-"}${amount}%`;

  const sparkColor = trend ? sparkColors[tone] : "primary";

  // One sentence for screen readers. Good or bad is only spoken when goodWhen was set on purpose.
  let reading = `${label}: ${valueText}${unit ?? ""}.`;
  if (trend) {
    reading += ` ${words}${dir === "flat" ? "" : ` ${amount}%`}`;
    if (trend.label) reading += ` ${trend.label.replace(/^vs\.?\s+/i, "compared with ")}`;
    if (trend.goodWhen && dir !== "flat") reading += `, ${dir === goodWhen ? "an improvement" : "worse"}`;
    reading += ".";
  }
  if (description) reading += ` ${description}`;

  return (
    <div {...rest} ref={ref} className={root}>
      <span className="sr-only">{reading}</span>
      <p aria-hidden="true" className="text-sm text-[var(--rd-color-text-muted)]">
        {label}
      </p>
      <div aria-hidden="true" className="flex items-end justify-between gap-4">
        <p className={cx("flex items-baseline gap-1 font-semibold tracking-[-0.02em] tabular-nums text-[var(--rd-color-text-default)]", valueSizes[size])}>
          {valueText}
          {unit && <span className={cx("font-medium text-[var(--rd-color-text-muted)]", unitSizes[size])}>{unit}</span>}
        </p>
        {data && data.length > 0 && <Sparkline type="area" data={data} color={sparkColor} />}
      </div>
      {trend && (
        <p aria-hidden="true" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span
            className={cx(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium tabular-nums text-[var(--rd-color-text-default)]",
              tints[tone],
            )}
          >
            {dir === "up" ? <ArrowUpIcon className="size-3.5 shrink-0" /> : dir === "down" ? <ArrowDownIcon className="size-3.5 shrink-0" /> : <MinusIcon className="size-3.5 shrink-0" />}
            {shown}
          </span>
          {trend.label && <span className="text-[var(--rd-color-text-muted)]">{trend.label}</span>}
        </p>
      )}
      {description && (
        <p aria-hidden="true" className="text-sm text-[var(--rd-color-text-muted)]">
          {description}
        </p>
      )}
    </div>
  );
});
