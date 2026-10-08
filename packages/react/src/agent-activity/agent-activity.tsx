"use client";

import { forwardRef, useEffect, useId, useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { agentActivityDefaults, type AgentActivitySpecProps } from "../generated/agent-activity.types";
import { ToolCall } from "../tool-call/tool-call";
import { isToolActive } from "../utils/ai";
import { cx } from "../utils/cx";
import { ChevronRightIcon, SpinnerIcon, SparkleIcon } from "../utils/icons";

export interface AgentActivityProps extends AgentActivitySpecProps {
  className?: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * What the assistant is doing or did, as a short summary that opens into each step. While work is
 * under way, or a step needs approval, the list stays open: an approval can't be left hidden.
 */
export const AgentActivity = forwardRef<HTMLDivElement, AgentActivityProps>(function AgentActivity(
  { tools, onApprove, onDeny, defaultOpen = agentActivityDefaults.defaultOpen, focusApproval = agentActivityDefaults.focusApproval, className },
  ref,
) {
  const [open, setOpen] = useState(defaultOpen);
  const listId = useId();
  const total = tools.length;
  const finished = tools.filter((t) => !isToolActive(t.state)).length;
  const failed = tools.filter((t) => t.state === "failed").length;
  const declined = tools.filter((t) => t.state === "denied").length;
  const needsAnswer = tools.some((t) => t.state === "awaiting-approval");
  const working = finished < total;
  const expanded = open || needsAnswer;
  // Once a question has been shown, keep the list open after it is answered: the step the person
  // just answered must still be there (focus returns to it). They can close it afterwards.
  useEffect(() => {
    if (needsAnswer) setOpen(true);
  }, [needsAnswer]);

  let summary: string;
  if (needsAnswer) summary = "Waiting for your approval";
  else if (working) summary = `Working: ${finished} of ${plural(total, "step", "steps")} done`;
  else {
    summary = `Used ${plural(total, "tool", "tools")}`;
    const notes = [failed && `${failed} failed`, declined && `${declined} declined`].filter(Boolean);
    if (notes.length) summary += ` (${notes.join(", ")})`;
  }

  if (total === 0) return null;
  return (
    <div ref={ref} className={cx("flex flex-col gap-2", className)}>
      <AriaButton
        aria-expanded={expanded}
        aria-controls={listId}
        // While an approval is waiting the list can't be closed, so the button says nothing it can't do.
        isDisabled={needsAnswer}
        onPress={() => setOpen((v) => !v)}
        className="inline-flex w-fit items-center gap-2 rounded-[var(--rd-radius-control)] px-2 py-1 text-sm text-[var(--rd-color-text-muted)] outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[disabled]:cursor-default"
      >
        {working && !needsAnswer ? <SpinnerIcon className="size-4 text-[var(--rd-color-action-primary)]" /> : <SparkleIcon />}
        <span>{summary}</span>
        <ChevronRightIcon className={cx("size-4 transition-transform motion-reduce:transition-none", expanded && "rotate-90")} />
      </AriaButton>
      {expanded && (
        <ul id={listId} aria-label="Steps" className="flex flex-col gap-1.5">
          {tools.map((tool) => (
            <li key={tool.id}>
              <ToolCall tool={tool} onApprove={onApprove} onDeny={onDeny} focusApproval={focusApproval} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
