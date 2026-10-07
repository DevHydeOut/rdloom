"use client";

import { useId, type ReactNode } from "react";
import { usageMeterDefaults, type UsageMeterSpecProps } from "../generated/usage-meter.types";
import { ActionButton } from "../action-button/action-button";
import { EmptyState } from "../empty-state/empty-state";
import { ErrorState } from "../error-state/error-state";
import { Button } from "../button/button";
import { Skeleton } from "../skeleton/skeleton";
import { cx } from "../utils/cx";
import { formatAmount } from "../utils/billing-format";
import { ErrorIcon, WarningIcon } from "../utils/icons";
import { resolvePermission } from "../utils/permissions";
import { StateBoundary } from "../utils/state-boundary";
import type { DataState } from "../utils/state";

export interface UsageMeterProps extends UsageMeterSpecProps {
  className?: string;
}

type Level = "ok" | "warning" | "danger";

const bars: Record<Level, string> = {
  ok: "bg-[var(--rd-color-action-primary)]",
  warning: "bg-[var(--rd-color-feedback-warning)]",
  danger: "bg-[var(--rd-color-feedback-danger)]",
};

/** How full the meter is and what that means, so the same words are shown and said. */
function measure(value: number, limit: number, warningAt: number, dangerAt: number) {
  const percent = limit > 0 ? (value / limit) * 100 : value > 0 ? 100 : 0;
  const over = value > limit;
  const level: Level = percent >= dangerAt ? "danger" : percent >= warningAt ? "warning" : "ok";
  const text = level === "danger" ? (over ? "Over the limit" : "Limit reached") : level === "warning" ? "Near the limit" : "";
  return { percent, level, text };
}

/**
 * A labeled meter for a limit, with role="meter". It warns with words and an icon as well as color, and can offer an
 * upgrade when near the limit. The numbers are yours. UI permission is not security: the server must check again.
 */
export function UsageMeter({
  label,
  value,
  limit,
  unit,
  formatValue = (n: number) => formatAmount(n),
  description,
  warningAt = usageMeterDefaults.warningAt,
  dangerAt = usageMeterDefaults.dangerAt,
  onUpgrade,
  upgradeLabel = usageMeterDefaults.upgradeLabel,
  state = "ready",
  permissions,
  classNames,
  className,
}: UsageMeterProps) {
  const labelId = useId();
  const descriptionId = useId();
  const access = resolvePermission(permissions?.upgrade);

  if (state === "loading") {
    return (
      <div aria-busy="true" aria-label={`Loading ${label}`} role="group" className={cx("flex w-full flex-col gap-2", classNames?.root, className)}>
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="rect" height={10} />
      </div>
    );
  }

  const { percent, level, text } = measure(value, limit, warningAt, dangerAt);
  const unitText = unit ? ` ${unit}` : "";
  const amounts = `${formatValue(value)} of ${formatValue(limit)}${unitText}`;
  const Icon = level === "danger" ? ErrorIcon : WarningIcon;
  const showUpgrade = Boolean(onUpgrade) && level !== "ok" && access.isVisible;

  return (
    <div className={cx("flex w-full flex-col gap-2", classNames?.root, className)}>
      <div className={cx("flex items-baseline justify-between gap-3", classNames?.header)}>
        <span id={labelId} className={cx("text-sm font-medium text-[var(--rd-color-text-default)]", classNames?.label)}>
          {label}
        </span>
        <span className={cx("text-sm tabular-nums text-[var(--rd-color-text-muted)]", classNames?.value)}>{amounts}</span>
      </div>
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(Math.max(value, 0), limit)}
        aria-valuetext={`${amounts}${text ? `, ${text.toLowerCase()}` : ""}`}
        className={cx("h-2.5 w-full overflow-hidden rounded-full bg-[var(--rd-color-border-default)]", classNames?.track)}
      >
        <div
          className={cx("h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none", bars[level], classNames?.bar)}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      {level !== "ok" && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {(
            <p
              className={cx(
                "flex items-center gap-1.5 text-sm font-medium",
                level === "danger" ? "text-[var(--rd-color-feedback-danger)]" : "text-[var(--rd-color-text-default)]",
                classNames?.status,
              )}
            >
              <Icon className={cx("size-4 shrink-0", level === "warning" && "text-[var(--rd-color-feedback-warning)]")} />
              {text}
            </p>
          )}
          {showUpgrade && (
            <ActionButton variant="secondary" size="sm" permission={permissions?.upgrade} onAction={onUpgrade!} className={classNames?.upgradeButton}>
              {upgradeLabel}
            </ActionButton>
          )}
        </div>
      )}
      {description && (
        <p id={descriptionId} className={cx("text-xs text-[var(--rd-color-text-muted)]", classNames?.description)}>
          {description}
        </p>
      )}
    </div>
  );
}

export interface UsageMeterListProps {
  /** The meters, each with the props of a UsageMeter. */
  meters: Array<UsageMeterProps & { id?: string }>;
  /** Names the list for screen readers. */
  label?: string;
  /** loading shows skeletons, empty says there is nothing to show, error says it could not load. */
  state?: DataState;
  onRetry?: () => void;
  classNames?: Partial<Record<"root" | "item", string>>;
  className?: string;
}

/** Several UsageMeters as one list. */
export function UsageMeterList({ meters, label = "Usage", state, onRetry, classNames, className }: UsageMeterListProps) {
  const current: DataState = state ?? (meters.length === 0 ? "empty" : "ready");
  const loading: ReactNode = (
    <ul aria-label={label} className={cx("flex flex-col gap-5", classNames?.root, className)}>
      {[0, 1, 2].map((i) => (
        <li key={i} className={classNames?.item}>
          <UsageMeter label="usage" value={0} limit={1} state="loading" />
        </li>
      ))}
    </ul>
  );
  return (
    <StateBoundary
      state={current}
      loading={loading}
      empty={<EmptyState size="sm" title="No usage to show yet" description="Meters appear here once there is something to measure." />}
      error={
        <ErrorState
          variant="inline"
          title="Couldn't load usage"
          actions={
            onRetry && (
              <Button variant="secondary" onPress={onRetry}>
                Try again
              </Button>
            )
          }
        />
      }
    >
      <ul aria-label={label} className={cx("flex flex-col gap-5", classNames?.root, className)}>
        {meters.map((meter, i) => (
          <li key={meter.id ?? `${meter.label}-${i}`} className={classNames?.item}>
            <UsageMeter {...meter} />
          </li>
        ))}
      </ul>
    </StateBoundary>
  );
}
