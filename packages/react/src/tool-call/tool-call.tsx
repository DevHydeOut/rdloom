"use client";

import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { toolCallDefaults, type ToolCallSpecProps } from "../generated/tool-call.types";
import { ApprovalBox } from "../approval-box/approval-box";
import { toolDuration, toolStateLabel, type ToolState } from "../utils/ai";
import { cx } from "../utils/cx";
import { BanIcon, ChevronRightIcon, ClockIcon, ErrorIcon, Spinner, SuccessIcon, WarningIcon } from "../utils/icons";

export interface ToolCallProps extends ToolCallSpecProps {
  className?: string;
}

/** Turns `query_sales` into "Query sales" when the tool has no title of its own. */
const readable = (name: string) => {
  const spaced = name.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return spaced ? spaced[0].toUpperCase() + spaced.slice(1) : name;
};

function StateIcon({ state }: { state: ToolState }) {
  switch (state) {
    case "pending":
      return <ClockIcon className="size-4 text-[var(--rd-color-text-muted)]" />;
    case "running":
      return <Spinner className="size-4 text-[var(--rd-color-action-primary)]" />;
    case "awaiting-approval":
      return <WarningIcon className="size-4 text-[var(--rd-color-feedback-warning)]" />;
    case "approved":
      return <SuccessIcon className="size-4 text-[var(--rd-color-feedback-info)]" />;
    case "denied":
      return <BanIcon className="size-4 text-[var(--rd-color-text-muted)]" />;
    case "done":
      return <SuccessIcon className="size-4 text-[var(--rd-color-feedback-success)]" />;
    case "failed":
      return <ErrorIcon className="size-4 text-[var(--rd-color-feedback-danger)]" />;
  }
}

const MAX_SHOWN = 4000;
/** Pretty JSON for display, cut at a sensible length, and never throwing on odd values. */
function show(value: unknown): string {
  let text: string;
  try {
    text = typeof value === "string" ? value : (JSON.stringify(value, null, 2) ?? String(value));
  } catch {
    text = String(value);
  }
  return text.length > MAX_SHOWN ? `${text.slice(0, MAX_SHOWN)}\n… (${text.length - MAX_SHOWN} more characters)` : text;
}

/**
 * One thing the assistant did: its name, where it is (waiting, running, needs approval, done,
 * failed) in words and a distinct icon, how long it took, and on request what went in and out.
 * A tool that needs approval shows an ApprovalBox right here.
 */
export const ToolCall = forwardRef<HTMLDivElement, ToolCallProps>(function ToolCall(
  { tool, onApprove, onDeny, defaultExpanded = toolCallDefaults.defaultExpanded, focusApproval = toolCallDefaults.focusApproval, className },
  ref,
) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const detailsId = useId();
  const header = useRef<HTMLButtonElement>(null);
  const title = tool.title ?? readable(tool.name);
  const stateWords = toolStateLabel[tool.state];
  const duration = toolDuration(tool);
  const hasDetails = tool.input !== undefined || tool.output !== undefined || !!tool.error;
  const awaiting = tool.state === "awaiting-approval" && !!tool.approval;

  // A status line for screen readers that changes as the tool moves on. It starts empty so only changes are spoken.
  const [spoken, setSpoken] = useState("");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      // A tool that arrives already finished is part of history: don't read it out again.
      return;
    }
    setSpoken(`${title}: ${stateWords}${tool.state === "failed" && tool.error ? `. ${tool.error}` : ""}`);
  }, [tool.state, title, stateWords, tool.error]);

  // The approval box disappears once answered: send focus to the tool itself, not to the page top.
  const answer = (handler?: (id: string) => void) => () => {
    handler?.(tool.id);
    queueMicrotask(() => header.current?.focus());
  };

  return (
    <div
      ref={ref}
      data-state={tool.state}
      className={cx("flex flex-col gap-2 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]", className)}
    >
      <div className="text-sm">
        <AriaButton
          ref={header}
          aria-expanded={hasDetails ? expanded : undefined}
          aria-controls={hasDetails ? detailsId : undefined}
          onPress={() => hasDetails && setExpanded((v) => !v)}
          className={cx(
            "flex w-full items-center gap-2.5 rounded-[var(--rd-radius-control)] px-3 py-2 text-start outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
            hasDetails ? "data-[hovered]:bg-[var(--rd-color-surface-subtle)]" : "cursor-default",
          )}
        >
          <StateIcon state={tool.state} />
          <span className="min-w-0 flex-1 truncate font-medium text-[var(--rd-color-text-default)]">{title}</span>
          <span className="sr-only">, </span>
          {/* The state is said in words as well as drawn, and it is part of the button's name. */}
          <span className="shrink-0 text-xs text-[var(--rd-color-text-muted)]">
            {stateWords}
            {duration && <span> · {duration}</span>}
          </span>
          {hasDetails && <ChevronRightIcon className={cx("size-4 shrink-0 text-[var(--rd-color-text-muted)] transition-transform motion-reduce:transition-none", expanded && "rotate-90")} />}
        </AriaButton>
      </div>

      {awaiting && (
        <div className="px-3 pb-3">
          <ApprovalBox
            summary={tool.approval!.summary}
            risk={tool.approval!.risk}
            reversible={tool.approval!.reversible}
            onApprove={answer(onApprove)}
            onDeny={answer(onDeny)}
            autoFocus={focusApproval}
          />
        </div>
      )}

      {hasDetails && expanded && (
        <div id={detailsId} className="flex flex-col gap-2 border-t border-[var(--rd-color-border-default)] px-3 py-2.5 text-xs">
          {tool.input !== undefined && <Detail label="Input" text={show(tool.input)} />}
          {tool.output !== undefined && <Detail label="Result" text={show(tool.output)} />}
          {tool.error && (
            <p className="text-[var(--rd-color-feedback-danger)]">
              <span className="font-semibold">Error: </span>
              {tool.error}
            </p>
          )}
        </div>
      )}

      <span role="status" className="sr-only">
        {spoken}
      </span>
    </div>
  );
});

function Detail({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="font-semibold text-[var(--rd-color-text-muted)]">{label}</span>
      <pre tabIndex={0} className="max-h-48 overflow-auto rounded bg-[var(--rd-color-surface-subtle)] p-2 font-mono leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]">
        {text}
      </pre>
    </div>
  );
}
