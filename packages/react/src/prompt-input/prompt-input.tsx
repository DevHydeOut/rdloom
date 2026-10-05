"use client";

import { forwardRef, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button as AriaButton } from "react-aria-components";
import { promptInputDefaults, type PromptInputSpecProps } from "../generated/prompt-input.types";
import { cx } from "../utils/cx";
import { SendIcon, StopIcon } from "../utils/icons";

export interface PromptInputProps extends PromptInputSpecProps {
  className?: string;
}

export interface PromptInputHandle {
  focus: () => void;
}

const MAX_HEIGHT = 200;

/**
 * The box people type a message in. Enter sends, Shift+Enter starts a new line, and the Send
 * button turns into Stop while a reply is on its way. Enter does nothing mid-IME-composition,
 * so typing in Japanese, Chinese or Korean can't send a half-written word.
 */
export const PromptInput = forwardRef<PromptInputHandle, PromptInputProps>(function PromptInput(
  {
    onSubmit,
    onStop,
    isStreaming = promptInputDefaults.isStreaming,
    isDisabled = promptInputDefaults.isDisabled,
    placeholder = promptInputDefaults.placeholder,
    label = promptInputDefaults.label,
    value: controlled,
    onValueChange,
    maxLength,
    className,
  },
  ref,
) {
  const [inner, setInner] = useState("");
  const value = controlled ?? inner;
  const field = useRef<HTMLTextAreaElement>(null);
  const hintId = useId();
  useImperativeHandle(ref, () => ({ focus: () => field.current?.focus() }), []);

  const set = (next: string) => {
    if (controlled === undefined) setInner(next);
    onValueChange?.(next);
  };

  // Grow with the text up to a limit, then scroll.
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const trimmed = value.trim();
  const canSend = trimmed !== "" && !isDisabled && !isStreaming;

  const send = () => {
    if (!canSend) return;
    onSubmit(trimmed);
    set("");
    field.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    send();
  };

  return (
    <div
      className={cx(
        "flex flex-col gap-1.5 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-default)] p-2 focus-within:ring-2 focus-within:ring-[var(--rd-color-focus-ring)]",
        isDisabled && "opacity-60",
        className,
      )}
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={field}
          rows={1}
          aria-label={label}
          aria-describedby={hintId}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          disabled={isDisabled}
          onChange={(e) => set(e.target.value)}
          onKeyDown={onKeyDown}
          className="max-h-[200px] min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-[var(--rd-color-text-default)] outline-none placeholder:text-[var(--rd-color-text-muted)]"
        />
        {isStreaming ? (
          <AriaButton
            aria-label="Stop generating"
            onPress={onStop}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--rd-color-text-default)] text-[var(--rd-color-surface-default)] outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
          >
            <StopIcon />
          </AriaButton>
        ) : (
          <AriaButton
            aria-label="Send message"
            isDisabled={!canSend}
            onPress={send}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)] outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[hovered]:bg-[var(--rd-color-action-primary-hover)]"
          >
            <SendIcon />
          </AriaButton>
        )}
      </div>
      <p id={hintId} className="px-2 text-xs text-[var(--rd-color-text-muted)]">
        Enter to send, Shift+Enter for a new line
      </p>
    </div>
  );
});
