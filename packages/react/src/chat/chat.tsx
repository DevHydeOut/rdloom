"use client";

import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { chatDefaults, type ChatSpecProps } from "../generated/chat.types";
import { Message } from "../message/message";
import { PromptInput } from "../prompt-input/prompt-input";
import { pendingApproval } from "../utils/ai";
import { cx } from "../utils/cx";
import { ArrowDownIcon, SparkleIcon } from "../utils/icons";

export interface ChatProps extends ChatSpecProps {
  className?: string;
}

const NEAR_BOTTOM = 80;
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * A whole conversation: the messages, a box to write in, and the stop and scroll controls.
 * It shows what you give it and reports what the person does (onSend, onStop, onApprove,
 * onDeny); it never calls a model. Give it a height (it fills its parent) so the messages scroll
 * and the box stays put.
 *
 * For screen readers the message list is not a live region (streamed text would be read token by
 * token). Instead a single status line says when a reply starts and when it is done, and each
 * tool announces its own changes.
 */
export const Chat = forwardRef<HTMLDivElement, ChatProps>(function Chat(
  { messages, onSend, onStop, onApprove, onDeny, onRetry, status = chatDefaults.status, label = chatDefaults.label, placeholder, suggestions, emptyState, headingLevel, className },
  ref,
) {
  const scroller = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  const [away, setAway] = useState(false);
  const busy = status === "submitted" || status === "streaming";

  const toBottom = useCallback(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
    stuck.current = near;
    setAway(!near);
  };

  // Follow the reply as it grows, unless the person scrolled up to read something.
  useIsoLayoutEffect(() => {
    if (stuck.current) toBottom();
  }, [messages, status, toBottom]);
  useEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => stuck.current && toBottom());
    observer.observe(el);
    return () => observer.disconnect();
  }, [toBottom]);

  // One polite line for a reply starting and finishing; nothing per token.
  const [announcement, setAnnouncement] = useState("");
  const before = useRef(status);
  useEffect(() => {
    const was = before.current;
    before.current = status;
    if (was === status) return;
    if (status === "submitted" || (status === "streaming" && was === "ready")) setAnnouncement("Assistant is responding");
    else if (status === "ready" && (was === "streaming" || was === "submitted")) setAnnouncement("Response complete");
    else if (status === "error") setAnnouncement("Something went wrong with the response");
  }, [status]);

  // Only the newest question should pull focus; older, unanswered ones stay quiet.
  const lastApproval = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) if (pendingApproval(messages[i])) return messages[i].id;
    return undefined;
  }, [messages]);

  const empty = messages.length === 0;
  const lastIndex = messages.length - 1;

  const send = (text: string) => {
    stuck.current = true; // sending means "I'm here": show what comes back
    onSend(text);
  };

  return (
    <section ref={ref} aria-label={label} className={cx("flex h-full min-h-0 flex-col", className)}>
      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          role="log"
          // Not live: the status line below speaks for the whole reply.
          aria-live="off"
          aria-label={`${label} messages`}
          aria-busy={busy || undefined}
          tabIndex={0}
          onScroll={onScroll}
          className="h-full overflow-y-auto overscroll-contain px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rd-color-focus-ring)]"
        >
          <div ref={inner} className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {empty ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                {emptyState ?? (
                  <>
                    <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] text-[var(--rd-color-action-primary)] ring-1 ring-[var(--rd-color-border-default)]">
                      <SparkleIcon className="size-5" />
                    </span>
                    <p className="text-sm text-[var(--rd-color-text-muted)]">Ask anything to get started.</p>
                  </>
                )}
                {suggestions && suggestions.length > 0 && (
                  <ul aria-label="Suggested prompts" className="flex flex-wrap justify-center gap-2">
                    {suggestions.map((text) => (
                      <li key={text}>
                        <AriaButton
                          onPress={() => send(text)}
                          className="rounded-full border border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-default)] px-3 py-1.5 text-sm text-[var(--rd-color-text-default)] outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]"
                        >
                          {text}
                        </AriaButton>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              messages.map((message, i) => (
                <Message
                  key={message.id}
                  message={message}
                  onApprove={onApprove}
                  onDeny={onDeny}
                  onRetry={i === lastIndex ? onRetry : undefined}
                  focusApproval={message.id === lastApproval}
                  headingLevel={headingLevel}
                />
              ))
            )}
            {/* The assistant has been asked but hasn't produced a message yet. */}
            {status === "submitted" && messages[lastIndex]?.role === "user" && (
              <Message message={{ id: "pending", role: "assistant", status: "streaming", parts: [] }} />
            )}
          </div>
        </div>
        {away && (
          <AriaButton
            onPress={() => {
              stuck.current = true;
              toBottom();
              setAway(false);
              scroller.current?.focus();
            }}
            className="absolute start-1/2 bottom-3 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--rd-color-text-default)] shadow-md outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
          >
            <ArrowDownIcon />
            Jump to latest
          </AriaButton>
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pt-2 pb-4">
        <PromptInput onSubmit={send} onStop={onStop} isStreaming={busy} placeholder={placeholder} />
      </div>

      <div role="status" className="sr-only">
        {announcement}
      </div>
    </section>
  );
});

