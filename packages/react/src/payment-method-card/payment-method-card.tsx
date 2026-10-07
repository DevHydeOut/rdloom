"use client";

import { useEffect, useRef, useState } from "react";
import { paymentMethodCardDefaults, type PaymentMethodCardSpecProps } from "../generated/payment-method-card.types";
import { ActionButton } from "../action-button/action-button";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { EmptyState } from "../empty-state/empty-state";
import { ErrorState } from "../error-state/error-state";
import { Skeleton } from "../skeleton/skeleton";
import { cx } from "../utils/cx";
import { CreditCardIcon, ErrorIcon, WarningIcon } from "../utils/icons";
import { StateBoundary } from "../utils/state-boundary";

export interface PaymentMethodCardProps extends PaymentMethodCardSpecProps {
  className?: string;
}

const DAY = 86_400_000;

/** Whether the card has run out, or runs out within `soonDays`. A card is good until the end of its expiry month. */
function expiryOf(expMonth: number, expYear: number, now: Date, soonDays: number): "ok" | "soon" | "expired" {
  const lastDay = Date.UTC(expYear, expMonth, 1) - 1;
  const left = lastDay - now.getTime();
  if (left < 0) return "expired";
  return left <= soonDays * DAY ? "soon" : "ok";
}

/**
 * One payment method with its last four digits, expiry and actions, or the way to add the first one. It shows a text
 * chip for the brand, never a logo, and never holds more than the last four digits.
 * UI permission is not security: the server must check again.
 */
export function PaymentMethodCard({
  method,
  expiresSoonDays = paymentMethodCardDefaults.expiresSoonDays,
  now,
  state = "ready",
  onRetry,
  onAdd,
  onUpdate,
  onRemove,
  onMakeDefault,
  permissions,
  classNames,
  className,
}: PaymentMethodCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const methodRef = useRef(method);
  methodRef.current = method;
  const removed = useRef(false);
  const [announcement, setAnnouncement] = useState("");

  // After a removal the buttons are gone; focus moves to the card, which is still here.
  useEffect(() => {
    if (removed.current && !method) {
      removed.current = false;
      rootRef.current?.focus();
    }
  }, [method]);

  const current: typeof state = state === "ready" && !method ? "empty" : state;
  const last4 = method ? `ending in ${method.last4}` : "";

  return (
    <div
      ref={rootRef}
      role="group"
      tabIndex={-1}
      aria-label={method ? `Payment method, ${last4}` : "Payment method"}
      className={cx(
        "flex w-full flex-col gap-4 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5 outline-none [box-shadow:var(--rd-elevation-raised)]",
        classNames?.root,
        className,
      )}
    >
      <StateBoundary
        state={current}
        loading={
          <div className="flex flex-col gap-3">
            <Skeleton variant="text" width="45%" />
            <Skeleton variant="text" width="30%" />
          </div>
        }
        empty={
          <EmptyState size="sm" icon={<CreditCardIcon />} title="No payment method yet" description="Add a card so your plan can renew without a gap.">
            {onAdd && (
              <ActionButton permission={permissions?.add} onAction={onAdd} className={classNames?.addButton}>
                Add a payment method
              </ActionButton>
            )}
          </EmptyState>
        }
        error={
          <ErrorState
            variant="inline"
            title="Couldn't load your payment method"
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
        {method && (() => {
          const expiry = expiryOf(method.expMonth, method.expYear, now ?? new Date(), expiresSoonDays);
          const expiryText = `${String(method.expMonth).padStart(2, "0")}/${method.expYear}`;
          const brand = method.brand ?? "Card";
          const Notice = expiry === "expired" ? ErrorIcon : WarningIcon;
          return (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cx(
                    "inline-flex h-8 items-center gap-1.5 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] px-2 text-xs font-semibold uppercase tracking-wide text-[var(--rd-color-text-default)]",
                    classNames?.brand,
                  )}
                >
                  <CreditCardIcon className="size-4 shrink-0" />
                  {brand}
                </span>
                <div className={cx("flex min-w-0 flex-1 flex-col", classNames?.details)}>
                  <p className={cx("text-base font-medium tabular-nums text-[var(--rd-color-text-default)]", classNames?.number)}>
                    <span aria-hidden="true">•••• {method.last4}</span>
                    <span className="sr-only">
                      {brand} {last4}
                    </span>
                  </p>
                  <p className={cx("text-sm text-[var(--rd-color-text-muted)]", classNames?.expiry)}>
                    Expires {expiryText}
                    {method.holder ? ` · ${method.holder}` : ""}
                  </p>
                </div>
                {method.isDefault && (
                  <Badge variant="info" className={classNames?.badge}>
                    Default
                  </Badge>
                )}
              </div>

              {expiry !== "ok" && (
                <p
                  className={cx(
                    "flex items-center gap-2 text-sm font-medium",
                    expiry === "expired" ? "text-[var(--rd-color-feedback-danger)]" : "text-[var(--rd-color-text-default)]",
                    classNames?.notice,
                  )}
                >
                  <Notice className={cx("size-4 shrink-0", expiry === "soon" && "text-[var(--rd-color-feedback-warning)]")} />
                  {expiry === "expired" ? `Expired on ${expiryText}. Update it to keep paying.` : `Expires soon, ${expiryText}. Update it to avoid a failed payment.`}
                </p>
              )}

              {(onUpdate || onMakeDefault || onRemove) && (
                <div className={cx("flex flex-wrap items-center gap-2 border-t border-[var(--rd-color-border-default)] pt-4", classNames?.actions)}>
                  {onUpdate && (
                    <ActionButton variant="secondary" permission={permissions?.update} onAction={() => onUpdate(method)} className={classNames?.updateButton}>
                      Update
                    </ActionButton>
                  )}
                  {onMakeDefault && !method.isDefault && (
                    <ActionButton
                      variant="ghost"
                      permission={permissions?.makeDefault}
                      onAction={() => onMakeDefault(method)}
                      onSuccess={() => setAnnouncement(`Default payment method changed to the one ${last4}`)}
                      className={classNames?.defaultButton}
                    >
                      Make default
                    </ActionButton>
                  )}
                  {onRemove && (
                    <ActionButton
                      variant="danger"
                      permission={permissions?.remove}
                      onAction={() => onRemove(method)}
                      onSuccess={() => {
                        setAnnouncement("Payment method removed");
                        if (methodRef.current) removed.current = true;
                        else rootRef.current?.focus();
                      }}
                      confirm={{
                        title: "Remove this payment method?",
                        description: method.isDefault
                          ? `The method ${last4} is your default. Add another one so your next payment does not fail.`
                          : `The method ${last4} will be removed from your account.`,
                        confirmLabel: "Remove",
                        cancelLabel: "Keep it",
                      }}
                      className={classNames?.removeButton}
                    >
                      Remove
                    </ActionButton>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </StateBoundary>
      <span role="status" className={cx("sr-only", classNames?.status)}>
        {announcement}
      </span>
    </div>
  );
}
