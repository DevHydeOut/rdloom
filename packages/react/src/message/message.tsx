"use client";

import { forwardRef, useMemo, useState, type ReactNode } from "react";
import { Button as AriaButton } from "react-aria-components";
import { messageDefaults, type MessageSpecProps } from "../generated/message.types";
import { AgentActivity } from "../agent-activity/agent-activity";
import { GeneratedChart } from "../generated-chart/generated-chart";
import { GeneratedTable } from "../generated-table/generated-table";
import { Response } from "../response/response";
import { Sources } from "../sources/sources";
import { groupParts, messageText, type CitationPart, type ChatMessage, type ReasoningPart } from "../utils/ai";
import { cx } from "../utils/cx";
import { ChevronRightIcon, ErrorIcon, FileIcon, SparkleIcon } from "../utils/icons";

export interface MessageProps extends MessageSpecProps {
  className?: string;
}

const roleName = { user: "You", assistant: "Assistant", system: "System" } as const;

/** The assistant's short account of how it got there. Closed by default: it is optional reading. */
function Reasoning({ part }: { part: ReasoningPart }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <AriaButton
        aria-expanded={open}
        onPress={() => setOpen((v) => !v)}
        className="inline-flex w-fit items-center gap-1.5 rounded px-1 text-xs text-[var(--rd-color-text-muted)] outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[hovered]:text-[var(--rd-color-text-default)]"
      >
        <ChevronRightIcon className={cx("size-3.5 transition-transform motion-reduce:transition-none", open && "rotate-90")} />
        {part.streaming ? "Thinking…" : "Reasoning"}
      </AriaButton>
      {open && <p className="border-s-2 border-[var(--rd-color-border-default)] ps-3 text-sm whitespace-pre-wrap text-[var(--rd-color-text-muted)]">{part.text}</p>}
    </div>
  );
}

function CopyMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <AriaButton
        onPress={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard blocked: nothing to confirm */
          }
        }}
        className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs text-[var(--rd-color-text-muted)] outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]"
      >
        {copied ? "Copied" : "Copy"}
        <span className="sr-only"> message</span>
      </AriaButton>
      <span role="status" className="sr-only">
        {copied ? "Message copied" : ""}
      </span>
    </>
  );
}

function ThinkingDots() {
  return (
    <div className="inline-flex items-center gap-1 text-sm text-[var(--rd-color-text-muted)]">
      <span className="sr-only">Assistant is thinking</span>
      <span aria-hidden="true" className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cx("size-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none", ["", "[animation-delay:160ms]", "[animation-delay:320ms]"][i])} />
        ))}
      </span>
    </div>
  );
}

/**
 * One message in a conversation: you or the assistant. It renders each part of the message with
 * the right component, in order: text as formatted markdown, tool calls grouped as activity,
 * tables and charts as real components, sources at the end.
 */
export const Message = forwardRef<HTMLElement, MessageProps>(function Message(
  { message, onApprove, onDeny, onRetry, actions, focusApproval = messageDefaults.focusApproval, headingLevel = messageDefaults.headingLevel, className },
  ref,
) {
  const mine = message.role === "user";
  const citations = useMemo(() => message.parts.filter((p): p is CitationPart => p.type === "citation"), [message.parts]);
  const groups = useMemo(() => groupParts(message.parts.filter((p) => p.type !== "citation")), [message.parts]);
  const canCopy = message.role === "assistant" && message.status !== "streaming" && messageText(message) !== "";
  const waiting = message.role === "assistant" && message.status === "streaming" && message.parts.length === 0;

  const body: ReactNode[] = groups.map((group, i) => {
    if (group.kind === "tools") {
      return <AgentActivity key={`tools-${i}`} tools={group.tools} onApprove={onApprove} onDeny={onDeny} focusApproval={focusApproval} />;
    }
    const part = group.part;
    switch (part.type) {
      case "text":
        return mine ? (
          <p key={i} className="whitespace-pre-wrap break-words">
            {part.text}
          </p>
        ) : (
          <Response key={i} isStreaming={part.streaming} citations={citations} headingLevel={headingLevel}>
            {part.text}
          </Response>
        );
      case "reasoning":
        return <Reasoning key={i} part={part} />;
      case "artifact":
        return part.kind === "table" ? (
          <GeneratedTable key={i} title={part.title} summary={part.summary} data={part.data} />
        ) : (
          <GeneratedChart key={i} title={part.title} summary={part.summary} data={part.data} />
        );
      case "file":
        return (
          <span key={i} className="inline-flex w-fit items-center gap-2 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] px-2.5 py-1.5 text-sm">
            <FileIcon className="size-4 shrink-0" />
            {part.url ? (
              <a href={part.url} download={part.name} className="underline underline-offset-2">
                {part.name}
              </a>
            ) : (
              part.name
            )}
          </span>
        );
    }
  });

  return (
    <article
      ref={ref}
      aria-label={`${roleName[message.role]} message`}
      aria-busy={message.status === "streaming" || undefined}
      data-role={message.role}
      data-status={message.status ?? "complete"}
      className={cx("flex gap-3", mine && "flex-row-reverse", className)}
    >
      {message.role === "assistant" && (
        <span aria-hidden="true" className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] text-[var(--rd-color-action-primary)] ring-1 ring-[var(--rd-color-border-default)]">
          <SparkleIcon />
        </span>
      )}
      <div className={cx("flex min-w-0 flex-col gap-3", mine ? "max-w-[85%] items-end" : "w-full max-w-prose")}>
        {mine ? (
          <div className="rounded-[var(--rd-radius-overlay)] bg-[var(--rd-color-surface-selected)] px-3.5 py-2 text-[var(--rd-color-text-default)]">{body}</div>
        ) : (
          body
        )}
        {waiting && <ThinkingDots />}
        {citations.length > 0 && <Sources sources={citations} />}

        {message.status === "stopped" && <p className="text-xs text-[var(--rd-color-text-muted)]">Stopped</p>}
        {message.status === "error" && (
          <p role="alert" className="inline-flex items-center gap-2 text-sm text-[var(--rd-color-feedback-danger)]">
            <ErrorIcon className="size-4 shrink-0" />
            Something went wrong.
            {onRetry && (
              <AriaButton onPress={onRetry} className="rounded px-1 font-medium underline underline-offset-2 outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]">
                Try again
              </AriaButton>
            )}
          </p>
        )}
        {(actions || canCopy) && (
          <div className="flex items-center gap-1">
            {canCopy && <CopyMessage text={messageText(message)} />}
            {actions}
          </div>
        )}
      </div>
    </article>
  );
});
