"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button as AriaButton, Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";
import { promptInputDefaults, type PromptInputSpecProps } from "../generated/prompt-input.types";
import { isLocalImage, type PromptAttachment } from "../utils/ai";
import { cx } from "../utils/cx";
import { CloseIcon, FileIcon, MicIcon, PaperclipIcon, PlusIcon, SendIcon, StopIcon } from "../utils/icons";

export interface PromptInputProps extends PromptInputSpecProps {
  className?: string;
}

export interface PromptInputHandle {
  focus: () => void;
}

const MAX_HEIGHT = 200;
/** One line of text plus its padding. Taller than this and the box grows into two rows. */
const ONE_LINE = 46;

const roundButton =
  "flex size-10 shrink-0 items-center justify-center rounded-full outline-none transition-colors " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[disabled]:cursor-not-allowed";
const quietButton =
  roundButton + " text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-surface-selected)] data-[hovered]:text-[var(--rd-color-text-default)] data-[pressed]:bg-[var(--rd-color-surface-selected)]";

const formatSize = (bytes?: number) => (bytes === undefined ? "" : bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

/**
 * The box people type a message in. It is one rounded bar: a "+" button on the left that opens a
 * menu (add files, plus any tools you offer), the text in the middle, and on the right your own
 * controls, a microphone button and Send. Added files show above the text, images as small
 * pictures. When the text grows past a line the bar becomes two rows and the buttons drop under it.
 *
 * Enter sends, Shift+Enter starts a new line, and Send turns into Stop while a reply is on its way.
 * Enter does nothing mid-IME-composition, so typing in Japanese, Chinese or Korean can't send a
 * half-written word. You only get the buttons you ask for: with just `onSubmit` it is a plain box.
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
    attachments = [],
    onAttach,
    onRemoveAttachment,
    accept,
    actions = [],
    onVoice,
    isListening = promptInputDefaults.isListening,
    endContent,
    className,
  },
  ref,
) {
  const [inner, setInner] = useState("");
  const value = controlled ?? inner;
  const field = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [expanded, setExpanded] = useState(false);
  useImperativeHandle(ref, () => ({ focus: () => field.current?.focus() }), []);

  const set = (next: string) => {
    if (controlled === undefined) setInner(next);
    onValueChange?.(next);
  };

  // Grow with the text up to a limit, then scroll. Once the bar has gone to two rows it stays that way
  // until the box is empty: with the buttons moved out of the row the same text fits on fewer lines, and
  // without this the bar would flip back and forth.
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    if (value === "") setExpanded(false);
    else if (value.includes("\n") || el.scrollHeight > ONE_LINE) setExpanded(true);
  }, [value]);

  const trimmed = value.trim();
  const hasContent = trimmed !== "" || attachments.length > 0;
  const canSend = hasContent && !isDisabled && !isStreaming;

  const send = () => {
    if (!canSend) return;
    onSubmit(trimmed, attachments);
    set("");
    field.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    send();
  };

  // Say what was added or removed, once, politely.
  const [announcement, setAnnouncement] = useState("");
  const before = useRef(attachments);
  useEffect(() => {
    const was = before.current;
    before.current = attachments;
    const added = attachments.filter((a) => !was.some((b) => b.id === a.id));
    const removed = was.filter((a) => !attachments.some((b) => b.id === a.id));
    if (added.length) setAnnouncement(`Added ${added.map((a) => a.name).join(", ")}`);
    else if (removed.length) setAnnouncement(`Removed ${removed.map((a) => a.name).join(", ")}`);
  }, [attachments]);

  const hasMenu = !!onAttach || actions.length > 0;

  return (
    <div
      className={cx(
        "flex flex-col rounded-[1.75rem] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] [box-shadow:var(--rd-elevation-raised)] transition-colors",
        "focus-within:border-[var(--rd-color-focus-ring)] focus-within:ring-1 focus-within:ring-[var(--rd-color-focus-ring)]",
        isDisabled && "opacity-60",
        className,
      )}
    >
      {attachments.length > 0 && (
        <ul aria-label="Attachments" className="flex flex-wrap gap-2.5 px-3.5 pt-3.5">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="relative">
              {isLocalImage(attachment) ? (
                // The person's own picture, shown small. Alt text is the file name.
                <img src={attachment.url} alt={attachment.name} className="size-16 rounded-2xl border border-[var(--rd-color-border-default)] object-cover" />
              ) : (
                <span className="flex h-16 max-w-56 items-center gap-2.5 rounded-2xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] ps-3 pe-8">
                  <FileIcon className="size-5 shrink-0 text-[var(--rd-color-text-muted)]" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-[var(--rd-color-text-default)]">{attachment.name}</span>
                    {attachment.size !== undefined && <span className="text-xs text-[var(--rd-color-text-muted)]">{formatSize(attachment.size)}</span>}
                  </span>
                </span>
              )}
              {onRemoveAttachment && (
                <AriaButton
                  aria-label={`Remove ${attachment.name}`}
                  onPress={() => {
                    onRemoveAttachment(attachment.id);
                    field.current?.focus();
                  }}
                  className="absolute -end-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] outline-none [box-shadow:var(--rd-elevation-raised)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]"
                >
                  <CloseIcon className="size-3" strokeWidth={2} />
                </AriaButton>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* The three parts keep their place in the page when the bar goes to two rows: only the grid areas change, so typing is never interrupted. */}
      <div
        className={cx(
          "grid items-center gap-x-1.5 gap-y-0.5 p-2",
          expanded ? "grid-cols-[1fr_auto] [grid-template-areas:'field_field''lead_trail']" : "grid-cols-[auto_1fr_auto] [grid-template-areas:'lead_field_trail']",
        )}
      >
        <div className="flex [grid-area:lead] items-center">
          {hasMenu && (
            <>
              <MenuTrigger>
                <AriaButton aria-label="Add attachments or tools" isDisabled={isDisabled} className={quietButton}>
                  <PlusIcon className="size-5" />
                </AriaButton>
                <Popover placement="top start" offset={8} className="min-w-72 overflow-auto rounded-3xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] p-2 text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-floating)]">
                  <Menu aria-label="Add to your message" className="flex flex-col outline-none">
                    {[
                      ...(onAttach
                        ? [{ id: "attach", label: "Add photos & files", description: "Upload from computer", icon: <PaperclipIcon className="size-5" />, onSelect: () => fileInput.current?.click(), isDisabled: false }]
                        : []),
                      ...actions,
                    ].map((action) => (
                      <MenuItem
                        key={action.id}
                        id={action.id}
                        textValue={action.label}
                        isDisabled={action.isDisabled}
                        onAction={action.onSelect}
                        className="flex cursor-default items-center gap-3 rounded-2xl px-3 py-2.5 text-sm outline-none data-[disabled]:opacity-50 data-[focused]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]"
                      >
                        {action.icon && (
                          <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center text-[var(--rd-color-text-muted)]">
                            {action.icon}
                          </span>
                        )}
                        <span className="flex flex-wrap items-baseline gap-x-3">
                          <span className="font-medium">{action.label}</span>
                          {action.description && <span className="text-[var(--rd-color-text-muted)]">{action.description}</span>}
                        </span>
                      </MenuItem>
                    ))}
                  </Menu>
                </Popover>
              </MenuTrigger>
              {onAttach && (
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept={accept}
                  hidden
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    event.target.value = ""; // choosing the same file again must still fire
                    if (files.length) onAttach(files);
                    field.current?.focus();
                  }}
                />
              )}
            </>
          )}
        </div>

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
          className="max-h-[200px] min-h-10 min-w-0 resize-none bg-transparent px-2 py-2 text-base leading-6 text-[var(--rd-color-text-default)] outline-none [grid-area:field] placeholder:text-[var(--rd-color-text-muted)] sm:text-[15px]"
        />

        <div className="flex [grid-area:trail] items-center gap-1">
          {endContent}
          {onVoice && (
            <AriaButton aria-label={isListening ? "Stop dictation" : "Dictate"} aria-pressed={isListening} isDisabled={isDisabled} onPress={onVoice} className={cx(quietButton, isListening && "bg-[var(--rd-color-surface-selected)] text-[var(--rd-color-action-primary)]")}>
              <MicIcon className="size-5" />
            </AriaButton>
          )}
          {isStreaming ? (
            <AriaButton
              aria-label="Stop generating"
              onPress={onStop}
              className={cx(roundButton, "bg-[var(--rd-color-text-default)] text-[var(--rd-color-surface-default)] data-[hovered]:opacity-85")}
            >
              <StopIcon />
            </AriaButton>
          ) : (
            <AriaButton
              aria-label="Send message"
              isDisabled={!canSend}
              onPress={send}
              className={cx(
                roundButton,
                "bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)] [box-shadow:var(--rd-elevation-control)] data-[disabled]:opacity-40 data-[disabled]:[box-shadow:none] data-[hovered]:bg-[var(--rd-color-action-primary-hover)]",
              )}
            >
              <SendIcon className="size-5" strokeWidth={2} />
            </AriaButton>
          )}
        </div>
      </div>

      {/* The keyboard hint is for assistive technology: the bar stays clean. */}
      <p id={hintId} className="sr-only">
        Enter to send, Shift+Enter for a new line
      </p>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
});
