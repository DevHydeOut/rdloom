"use client";

import { forwardRef, useId, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Button, Tag, TagGroup, TagList, type Key } from "react-aria-components";
import { tagInputDefaults, type TagInputSpecProps } from "../generated/tag-input.types";
import { cx } from "../utils/cx";
import { CloseIcon } from "../utils/icons";

export interface TagInputProps extends TagInputSpecProps {
  className?: string;
}

const plural = (n: number) => `${n} ${n === 1 ? "tag" : "tags"}`;

export const TagInput = forwardRef<HTMLDivElement, TagInputProps>(function TagInput(
  {
    label,
    description,
    errorMessage,
    value,
    defaultValue,
    onChange,
    placeholder,
    maxTags,
    allowDuplicates = tagInputDefaults.allowDuplicates,
    isDisabled = tagInputDefaults.isDisabled,
    isInvalid = tagInputDefaults.isInvalid,
    className,
  },
  ref,
) {
  const id = useId();
  const [inner, setInner] = useState<readonly string[]>(defaultValue ?? []);
  const tags = value ?? inner;
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const full = maxTags !== undefined && tags.length >= maxTags;

  const commit = (next: string[], message: string) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
    setNotice(message);
  };

  /** Adds each non-empty piece. Returns what was left over because it was refused. */
  const add = (pieces: string[]) => {
    const next = [...tags];
    const added: string[] = [];
    const refused: string[] = [];
    for (const raw of pieces) {
      const tag = raw.trim();
      if (!tag) continue;
      const duplicate = !allowDuplicates && next.some((t) => t.toLocaleLowerCase() === tag.toLocaleLowerCase());
      if (duplicate || (maxTags !== undefined && next.length >= maxTags)) {
        refused.push(tag);
        continue;
      }
      next.push(tag);
      added.push(tag);
    }
    if (added.length) commit(next, `${added.join(", ")} added, ${plural(next.length)}`);
    if (refused.length) {
      const why = maxTags !== undefined && next.length >= maxTags && !refused.every((t) => next.includes(t)) ? `limit of ${plural(maxTags)} reached` : "already added";
      setNotice((n) => `${n ? n + ". " : ""}${refused.join(", ")} not added: ${why}`);
    }
    return refused;
  };

  /** Tags are keyed by position, so two equal tags (allowDuplicates) stay separate. */
  const remove = (keys: Set<Key>) => {
    const next = tags.filter((_, i) => !keys.has(String(i)));
    const gone = tags.filter((_, i) => keys.has(String(i)));
    commit(next, `${gone.join(", ")} removed, ${plural(next.length)}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      if (e.key === "Enter" && !draft.trim()) return; // let an empty Enter submit the form
      e.preventDefault();
      setDraft(add([draft]).join(""));
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      remove(new Set([String(tags.length - 1)]));
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!/[,\n]/.test(text)) return;
    e.preventDefault();
    add(text.split(/[,\n]/));
  };

  const describedBy = [description && `${id}-d`, isInvalid && errorMessage && `${id}-e`].filter(Boolean).join(" ") || undefined;

  return (
    <div ref={ref} role="group" aria-labelledby={`${id}-l`} className={cx("flex flex-col gap-1.5", className)}>
      <label id={`${id}-l`} htmlFor={`${id}-i`} className="text-sm font-medium text-[var(--rd-color-text-default)]">
        {label}
      </label>
      <div
        data-invalid={isInvalid || undefined}
        data-disabled={isDisabled || undefined}
        className={cx(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-[var(--rd-radius-control)] border bg-[var(--rd-color-surface-default)] px-2 py-1.5 transition-colors",
          "border-[var(--rd-color-border-default)] hover:border-[var(--rd-color-border-strong)]",
          "focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--rd-color-focus-ring)]",
          "data-[invalid]:border-[var(--rd-color-feedback-danger)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        )}
      >
        <TagGroup aria-label={`${label}, ${plural(tags.length)}`} onRemove={isDisabled ? undefined : remove} className="contents">
          <TagList items={tags.map((text, i) => ({ id: String(i), text }))} className="contents">
            {(item) => (
              <Tag
                id={item.id}
                textValue={item.text}
                className={
                  "group flex max-w-full items-center gap-1 rounded-full border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] " +
                  "py-0.5 ps-2.5 pe-1 text-sm text-[var(--rd-color-text-default)] outline-none " +
                  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
                }
              >
                <span className="truncate">{item.text}</span>
                <Button
                  slot="remove"
                  className={
                    "flex size-5 items-center justify-center rounded-full text-[var(--rd-color-text-muted)] outline-none " +
                    "data-[hovered]:bg-[var(--rd-color-border-default)] data-[hovered]:text-[var(--rd-color-text-default)] " +
                    "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
                  }
                >
                  <CloseIcon className="size-3" />
                </Button>
              </Tag>
            )}
          </TagList>
        </TagGroup>
        <input
          id={`${id}-i`}
          value={draft}
          disabled={isDisabled || full}
          placeholder={tags.length === 0 ? placeholder : full ? "Limit reached" : undefined}
          aria-describedby={describedBy}
          aria-invalid={isInvalid || undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            setNotice("");
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => {
            // Text left in the box isn't lost when focus moves on.
            if (draft.trim()) setDraft(add([draft]).join(""));
          }}
          className="h-7 min-w-24 flex-1 bg-transparent text-sm text-[var(--rd-color-text-default)] outline-none placeholder:text-[var(--rd-color-text-muted)]"
        />
      </div>
      {description && (
        <p id={`${id}-d`} className="text-xs text-[var(--rd-color-text-muted)]">
          {description}
        </p>
      )}
      {isInvalid && errorMessage && (
        <p id={`${id}-e`} className="text-xs text-[var(--rd-color-feedback-danger)]">
          {errorMessage}
        </p>
      )}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {notice}
      </div>
    </div>
  );
});
