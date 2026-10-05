"use client";

import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { approvalBoxDefaults, type ApprovalBoxSpecProps } from "../generated/approval-box.types";
import { Button } from "../button/button";
import { cx } from "../utils/cx";
import { InfoIcon, WarningIcon } from "../utils/icons";

export interface ApprovalBoxProps extends ApprovalBoxSpecProps {
  className?: string;
}

const riskWords = { low: "Low risk", medium: "Medium risk", high: "High risk" } as const;

/**
 * Asks a person to approve or decline something the assistant wants to do. It says what will
 * happen in plain words, how risky it is (in words and a shape, not just color), and whether it
 * can be undone. When it appears it is announced; with `autoFocus` it also takes focus, on the
 * box itself so reading starts at the question and no button is pressed by a stray Enter.
 */
export const ApprovalBox = forwardRef<HTMLDivElement, ApprovalBoxProps>(function ApprovalBox(
  {
    summary,
    risk = approvalBoxDefaults.risk,
    reversible,
    onApprove,
    onDeny,
    approveLabel = approvalBoxDefaults.approveLabel,
    denyLabel = approvalBoxDefaults.denyLabel,
    isPending = approvalBoxDefaults.isPending,
    autoFocus = approvalBoxDefaults.autoFocus,
    children,
    className,
  },
  forwardedRef,
) {
  const titleId = useId();
  const own = useRef<HTMLDivElement | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const high = risk === "high";

  useEffect(() => {
    // A live region only speaks changes, so fill it after it exists.
    setAnnouncement(`Approval needed: ${summary}. ${riskWords[risk]}.${reversible === false ? " This can't be undone." : ""}`);
    if (autoFocus) own.current?.focus();
    // Once, when the question appears. A new question is a new box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={(node) => {
        own.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      role="group"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-risk={risk}
      className={cx(
        "flex flex-col gap-3 rounded-[var(--rd-radius-overlay)] border p-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]",
        high
          ? "border-[var(--rd-color-feedback-danger)] bg-[var(--rd-color-feedback-danger-subtle)]"
          : "border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-subtle)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {high ? <WarningIcon className="mt-0.5 size-5 shrink-0 text-[var(--rd-color-feedback-danger)]" /> : <InfoIcon className="mt-0.5 size-5 shrink-0 text-[var(--rd-color-feedback-info)]" />}
        <div className="flex min-w-0 flex-col gap-1">
          <p id={titleId} className="text-sm font-semibold text-[var(--rd-color-text-default)]">
            {summary}
          </p>
          <p className="text-xs text-[var(--rd-color-text-muted)]">
            <span className="font-medium text-[var(--rd-color-text-default)]">{riskWords[risk]}</span>
            {reversible === true && " · Can be undone"}
            {reversible === false && " · Can't be undone"}
          </p>
          {children && <div className="mt-1 text-sm text-[var(--rd-color-text-default)]">{children}</div>}
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" size="sm" onPress={onDeny} isDisabled={isPending}>
          {denyLabel}
        </Button>
        <Button variant={high ? "danger" : "primary"} size="sm" onPress={onApprove} isLoading={isPending}>
          {approveLabel}
        </Button>
      </div>
      {/* Spoken once when the box appears; assertive for high risk so it isn't queued behind other speech. */}
      <span role={high ? "alert" : "status"} className="sr-only">
        {announcement}
      </span>
    </div>
  );
});
