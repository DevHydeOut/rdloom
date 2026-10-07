"use client";

import { useId, useState } from "react";
import { planCardDefaults, type PlanCardSpecProps } from "../generated/plan-card.types";
import { ActionButton } from "../action-button/action-button";
import { Alert } from "../alert/alert";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { EmptyState } from "../empty-state/empty-state";
import { ErrorState } from "../error-state/error-state";
import { Skeleton } from "../skeleton/skeleton";
import { cx } from "../utils/cx";
import { formatDay, formatPrice } from "../utils/billing-format";
import { CheckIcon } from "../utils/icons";
import { StateBoundary } from "../utils/state-boundary";

export interface PlanCardProps extends PlanCardSpecProps {
  className?: string;
}

type Status = NonNullable<PlanCardSpecProps["status"]>;

const statusLook: Record<Status, { text: string; variant: "success" | "info" | "warning" | "neutral" }> = {
  active: { text: "Active", variant: "success" },
  trialing: { text: "Trial", variant: "info" },
  past_due: { text: "Past due", variant: "warning" },
  canceled: { text: "Canceled", variant: "neutral" },
};

/** The line about the date, worded for the status. */
function dateLine(status: Status, day: string): string {
  if (!day) return status === "past_due" ? "Payment failed" : "";
  switch (status) {
    case "trialing":
      return `Trial ends on ${day}`;
    case "past_due":
      return `Payment failed. Renewal was due on ${day}`;
    case "canceled":
      return `Ends on ${day}`;
    default:
      return `Renews on ${day}`;
  }
}

/**
 * The current plan with its status, renewal date, features and the actions to change or cancel it. Cancelling asks
 * first and says when access ends. It changes nothing itself. UI permission is not security: the server must check again.
 */
export function PlanCard({
  plan,
  status = planCardDefaults.status,
  periodEnd,
  usageHint,
  locale = planCardDefaults.locale,
  state = "ready",
  onRetry,
  onChangePlan,
  onCancel,
  onUpdatePayment,
  permissions,
  classNames,
  className,
}: PlanCardProps) {
  const nameId = useId();
  const [announcement, setAnnouncement] = useState("");
  const day = formatDay(periodEnd, locale);
  const current: typeof state = state === "ready" && !plan ? "empty" : state;
  const root = cx(
    "flex w-full flex-col gap-4 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5 [box-shadow:var(--rd-elevation-raised)]",
    classNames?.root,
    className,
  );
  const look = statusLook[status];

  return (
    <div role="group" aria-labelledby={plan ? nameId : undefined} aria-label={plan ? undefined : "Plan"} className={root}>
      <StateBoundary
        state={current}
        loading={
          <div className="flex flex-col gap-3">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="25%" />
            <Skeleton variant="text" lines={3} />
          </div>
        }
        empty={
          <EmptyState size="sm" title="You are not on a plan yet" description="Choose a plan to get started.">
            {onChangePlan && (
              <ActionButton permission={permissions?.changePlan} onAction={onChangePlan} className={classNames?.changeButton}>
                Choose a plan
              </ActionButton>
            )}
          </EmptyState>
        }
        error={
          <ErrorState
            variant="inline"
            title="Couldn't load your plan"
            description="Your plan is not affected. Try again in a moment."
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
        {plan && (
          <>
            <div className={cx("flex flex-wrap items-center justify-between gap-x-3 gap-y-2", classNames?.header)}>
              <h2 id={nameId} className={cx("text-lg font-semibold text-[var(--rd-color-text-default)]", classNames?.name)}>
                {plan.name}
              </h2>
              <Badge variant={look.variant} className={classNames?.status}>
                {look.text}
              </Badge>
            </div>

            {status === "past_due" && (
              <Alert variant="warning" title="Your last payment failed" className={classNames?.alert}>
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span>Update your payment method to keep your plan active.</span>
                  {onUpdatePayment && (
                    <ActionButton variant="secondary" size="sm" onAction={onUpdatePayment} className={classNames?.updateButton}>
                      Update payment method
                    </ActionButton>
                  )}
                </span>
              </Alert>
            )}

            <div className="flex flex-col gap-1">
              <p className={cx("text-[var(--rd-color-text-default)]", classNames?.price)}>
                <span className="text-2xl font-semibold tabular-nums">{formatPrice(plan.price, plan.currency, locale)}</span>
                <span className="text-sm text-[var(--rd-color-text-muted)]"> per {plan.interval}</span>
              </p>
              {dateLine(status, day) && <p className={cx("text-sm text-[var(--rd-color-text-muted)]", classNames?.renewal)}>{dateLine(status, day)}</p>}
              {plan.description && <p className="text-sm text-[var(--rd-color-text-muted)]">{plan.description}</p>}
            </div>

            {plan.features && plan.features.length > 0 && (
              <ul aria-label={`${plan.name} includes`} className={cx("flex flex-col gap-1.5", classNames?.features)}>
                {plan.features.map((feature) => (
                  <li key={feature} className={cx("flex items-start gap-2 text-sm text-[var(--rd-color-text-default)]", classNames?.feature)}>
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-[var(--rd-color-feedback-success)]" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {usageHint && <p className={cx("text-sm text-[var(--rd-color-text-muted)]", classNames?.usage)}>{usageHint}</p>}

            {(onChangePlan || (onCancel && status !== "canceled")) && (
              <div className={cx("flex flex-wrap items-center gap-2 border-t border-[var(--rd-color-border-default)] pt-4", classNames?.actions)}>
                {onChangePlan && (
                  <ActionButton permission={permissions?.changePlan} onAction={onChangePlan} className={classNames?.changeButton}>
                    {status === "canceled" ? "Choose a plan" : "Change plan"}
                  </ActionButton>
                )}
                {onCancel && status !== "canceled" && (
                  <ActionButton
                    variant="danger"
                    permission={permissions?.cancel}
                    onAction={onCancel}
                    onSuccess={() => setAnnouncement(day ? `Subscription canceled. You keep access until ${day}.` : "Subscription canceled.")}
                    confirm={{
                      title: "Cancel your subscription?",
                      description: day
                        ? `You keep access to ${plan.name} until ${day}. After that it is not renewed.`
                        : `You keep access to ${plan.name} until the end of the current period. After that it is not renewed.`,
                      confirmLabel: "Cancel subscription",
                      cancelLabel: "Keep my plan",
                    }}
                    className={classNames?.cancelButton}
                  >
                    Cancel subscription
                  </ActionButton>
                )}
              </div>
            )}
          </>
        )}
      </StateBoundary>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
