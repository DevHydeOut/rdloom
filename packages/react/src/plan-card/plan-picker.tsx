"use client";

import { useId, useState } from "react";
import { Radio, RadioGroup } from "react-aria-components";
import { ActionButton } from "../action-button/action-button";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { SegmentedControl, SegmentedControlItem } from "../segmented-control/segmented-control";
import { cx } from "../utils/cx";
import { formatPrice } from "../utils/billing-format";
import { CheckIcon } from "../utils/icons";
import { resolvePermission, type Permissions } from "../utils/permissions";

export type PlanInterval = "month" | "year";

export interface PlanOption {
  id: string;
  name: string;
  description?: string;
  /** The price of one interval, in whole units: 49 for $49 a month, 490 for $490 a year. */
  prices: { month: number; year: number };
  currency?: string;
  features?: string[];
  /** A short word on the card, e.g. "Most popular". */
  badge?: string;
}

export interface PlanPickerProps {
  plans: PlanOption[];
  /** The plan the workspace is on now. It is marked "Current plan". */
  currentPlanId?: string;
  /** The interval of the current plan; picking it again is not a change. */
  currentInterval?: PlanInterval;
  /** The chosen plan, when you control it. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (planId: string) => void;
  /** The shown interval, when you control it. */
  interval?: PlanInterval;
  defaultInterval?: PlanInterval;
  onIntervalChange?: (interval: PlanInterval) => void;
  /** A note beside Yearly, e.g. "2 months free". By default it says how much the cheapest saving is. */
  yearlyNote?: string;
  /** Switches to the chosen plan; yours, async. */
  onSelectPlan: (planId: string, interval: PlanInterval) => void | Promise<unknown>;
  /** The text of the button for the chosen plan. */
  selectLabel?: (plan: PlanOption) => string;
  /** Names the group for screen readers. */
  label?: string;
  permissions?: Permissions<"select">;
  locale?: string;
  className?: string;
  classNames?: Partial<Record<"root" | "interval" | "plans" | "plan" | "badge" | "features" | "actions" | "selectButton" | "hint", string>>;
}

/** The biggest percentage the yearly price saves over twelve months, or 0. */
function biggestSaving(plans: PlanOption[]): number {
  return Math.max(0, ...plans.map((p) => (p.prices.month > 0 ? Math.round((1 - p.prices.year / (p.prices.month * 12)) * 100) : 0)));
}

/**
 * Plans as a group of radio cards with a monthly or yearly toggle. Choosing a card changes nothing until the button
 * is pressed; then onSelectPlan runs. UI permission is not security: the server must check again.
 */
export function PlanPicker({
  plans,
  currentPlanId,
  currentInterval,
  value,
  defaultValue,
  onValueChange,
  interval,
  defaultInterval = "month",
  onIntervalChange,
  yearlyNote,
  onSelectPlan,
  selectLabel = (plan) => `Switch to ${plan.name}`,
  label = "Plans",
  permissions,
  locale = "en-US",
  className,
  classNames,
}: PlanPickerProps) {
  const [innerValue, setInnerValue] = useState(defaultValue ?? currentPlanId ?? plans[0]?.id ?? "");
  const [innerInterval, setInnerInterval] = useState<PlanInterval>(defaultInterval);
  const hintId = useId();
  const access = resolvePermission(permissions?.select);
  if (!access.isVisible) return null;

  const chosenId = value ?? innerValue;
  const shownInterval = interval ?? innerInterval;
  const chosen = plans.find((p) => p.id === chosenId);
  const saving = biggestSaving(plans);
  const note = yearlyNote ?? (saving > 0 ? `Save up to ${saving}%` : undefined);
  const isCurrent = chosen?.id === currentPlanId && (currentInterval === undefined || currentInterval === shownInterval);

  return (
    <div className={cx("flex w-full flex-col gap-4", classNames?.root, className)}>
      <div className={cx("flex flex-wrap items-center gap-3", classNames?.interval)}>
        <SegmentedControl
          label="Billing interval"
          selectedKey={shownInterval}
          onChange={(key) => {
            const next = key as PlanInterval;
            if (interval === undefined) setInnerInterval(next);
            onIntervalChange?.(next);
          }}
        >
          <SegmentedControlItem id="month">Monthly</SegmentedControlItem>
          <SegmentedControlItem id="year">Yearly</SegmentedControlItem>
        </SegmentedControl>
        {note && <span className="text-sm text-[var(--rd-color-text-muted)]">{note} with yearly billing</span>}
      </div>

      <RadioGroup
        aria-label={label}
        value={chosenId}
        onChange={(next) => {
          if (value === undefined) setInnerValue(next);
          onValueChange?.(next);
        }}
        className={cx("grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]", classNames?.plans)}
      >
        {plans.map((plan) => {
          const price = formatPrice(plan.prices[shownInterval], plan.currency, locale);
          const isCurrentPlan = plan.id === currentPlanId;
          return (
            <Radio
              key={plan.id}
              value={plan.id}
              aria-label={`${plan.name}, ${price} per ${shownInterval}${isCurrentPlan ? ", current plan" : ""}`}
              className={cx(
                "group flex cursor-pointer flex-col gap-3 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-4 outline-none",
                "data-[hovered]:border-[var(--rd-color-border-strong)]",
                "data-[selected]:border-[var(--rd-color-action-primary)] data-[selected]:[box-shadow:0_0_0_1px_var(--rd-color-action-primary)]",
                "data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
                classNames?.plan,
              )}
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-base font-semibold text-[var(--rd-color-text-default)]">{plan.name}</span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {isCurrentPlan && (
                    <Badge variant="success" size="sm">
                      Current plan
                    </Badge>
                  )}
                  {plan.badge && (
                    <Badge variant="info" size="sm" className={classNames?.badge}>
                      {plan.badge}
                    </Badge>
                  )}
                </span>
              </span>
              <span className="text-[var(--rd-color-text-default)]">
                <span className="text-2xl font-semibold tabular-nums">{price}</span>
                <span className="text-sm text-[var(--rd-color-text-muted)]"> per {shownInterval}</span>
              </span>
              {plan.description && <span className="text-sm text-[var(--rd-color-text-muted)]">{plan.description}</span>}
              {plan.features && plan.features.length > 0 && (
                <span className={cx("flex flex-col gap-1.5", classNames?.features)}>
                  {plan.features.map((feature) => (
                    <span key={feature} className="flex items-start gap-2 text-sm text-[var(--rd-color-text-default)]">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-[var(--rd-color-feedback-success)]" />
                      {feature}
                    </span>
                  ))}
                </span>
              )}
            </Radio>
          );
        })}
      </RadioGroup>

      <div className={cx("flex flex-wrap items-center justify-end gap-3", classNames?.actions)}>
        {access.isDisabled && access.reason && (
          <p id={hintId} className={cx("me-auto text-sm text-[var(--rd-color-text-muted)]", classNames?.hint)}>
            {access.reason}
          </p>
        )}
        {isCurrent && !access.isDisabled && (
          <p id={hintId} className={cx("me-auto text-sm text-[var(--rd-color-text-muted)]", classNames?.hint)}>
            This is your current plan.
          </p>
        )}
        {chosen &&
          (access.isDisabled ? (
            <Button
              aria-disabled="true"
              aria-describedby={access.reason ? hintId : undefined}
              onPress={() => {}}
              className={cx("opacity-50 cursor-not-allowed", classNames?.selectButton)}
            >
              {selectLabel(chosen)}
            </Button>
          ) : isCurrent ? (
            <Button isDisabled aria-describedby={hintId} className={classNames?.selectButton}>
              {selectLabel(chosen)}
            </Button>
          ) : (
            <ActionButton onAction={() => onSelectPlan(chosen.id, shownInterval)} className={classNames?.selectButton}>
              {selectLabel(chosen)}
            </ActionButton>
          ))}
      </div>
    </div>
  );
}
