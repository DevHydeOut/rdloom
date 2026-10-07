"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button as AriaButton } from "react-aria-components";
import { fieldArrayDefaults, type FieldArraySpecProps } from "../generated/field-array.types";
import { Button } from "../button/button";
import { firstFocusable } from "../form/focus";
import { useFormContext } from "../form/form";
import { useEngineArray } from "../form/form-engine";
import { cx } from "../utils/cx";
import { fieldError, fieldHelp, fieldLabel } from "../utils/field";
import { ArrowDownIcon, ArrowUpIcon, CloseIcon, PlusIcon } from "../utils/icons";

/** Every sentence the component says. Replace any of them to translate or reword. */
export interface FieldArrayMessages {
  rowLabel(item: string, n: number): string;
  remove(item: string, n: number): string;
  moveUp(item: string, n: number): string;
  moveDown(item: string, n: number): string;
  insertBelow(item: string, n: number): string;
  announceAdded(item: string, n: number): string;
  announceRemoved(item: string, n: number): string;
  announceMoved(item: string, to: number, total: number): string;
  maxReached(max: number): string;
}

const defaultMessages: FieldArrayMessages = {
  rowLabel: (item, n) => `${item} ${n}`,
  remove: (item, n) => `Remove ${item.toLowerCase()} ${n}`,
  moveUp: (item, n) => `Move ${item.toLowerCase()} ${n} up`,
  moveDown: (item, n) => `Move ${item.toLowerCase()} ${n} down`,
  insertBelow: (item, n) => `Insert ${item.toLowerCase()} below ${item.toLowerCase()} ${n}`,
  announceAdded: (item, n) => `${item} ${n} added`,
  announceRemoved: (item, n) => `${item} ${n} removed`,
  announceMoved: (item, to, total) => `${item} moved to position ${to} of ${total}`,
  maxReached: (max) => `You can add up to ${max}.`,
};

/** What the render function gets for each row. */
export interface FieldArrayRow {
  /** Zero-based position. */
  index: number;
  /** Stable for the life of the row, also while it moves. Use it as a key for your own parts. */
  id: string;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  /** The full name of a value in this row: name("qty") gives "lines[2].qty". */
  name(path?: string): string;
  remove(): void;
  moveUp(): void;
  moveDown(): void;
  insertBelow(): void;
}

export interface FieldArrayProps
  extends Omit<FieldArraySpecProps, "defaultRow" | "validate" | "messages" | "children"> {
  defaultRow: unknown | (() => unknown);
  validate?: (rows: any[]) => string | null | undefined | void;
  messages?: Partial<FieldArrayMessages>;
  children: (row: FieldArrayRow) => ReactNode;
  className?: string;
}

const rowButton =
  "flex size-8 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] outline-none " +
  "text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] " +
  "data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

type Action = "remove" | "moveUp" | "moveDown" | "insertBelow";
interface PendingFocus {
  /** The row to focus; or null for the Add button. */
  id: string | null;
  /** Controls to try in order; the first one that can take focus wins. Without any, the row's first field. */
  prefer?: Action[];
  /** The Add button when no row is left. */
  fallbackToAdd?: boolean;
}

/**
 * A repeating group of fields: add, remove, move up and down, and insert, all
 * with buttons so the keyboard does everything. After a change focus lands
 * somewhere sensible and a polite message says what happened. The values live
 * in the Form under `name`; what a row holds, and any total, is yours.
 */
export function FieldArray({
  name,
  label,
  description,
  itemLabel = fieldArrayDefaults.itemLabel,
  defaultRow,
  minRows = fieldArrayDefaults.minRows,
  maxRows,
  addLabel = fieldArrayDefaults.addLabel,
  emptyText = fieldArrayDefaults.emptyText,
  allowReorder = fieldArrayDefaults.allowReorder,
  allowInsert = fieldArrayDefaults.allowInsert,
  validate,
  messages: custom,
  children,
  className,
}: FieldArrayProps) {
  const { engine } = useFormContext();
  const array = useEngineArray(engine, name, { validate });
  const m = { ...defaultMessages, ...custom };
  const count = array.length;

  const idBase = useId();
  const idCounter = useRef(0);
  const newId = () => `${idBase}-${++idCounter.current}`;
  const ids = useRef<string[]>([]);
  while (ids.current.length < count) ids.current.push(newId());
  if (ids.current.length > count) ids.current.length = count;

  const root = useRef<HTMLFieldSetElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const pending = useRef<PendingFocus | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [announceCount, setAnnounceCount] = useState(0);
  const announce = (text: string) => {
    setAnnouncement(text);
    setAnnounceCount((n) => n + 1);
  };

  const descriptionId = useId();
  const errorId = useId();
  const hintId = useId();
  const error = array.errors[0];
  const atMax = maxRows !== undefined && count >= maxRows;
  const atMin = count <= minRows;
  const makeRow = () => (typeof defaultRow === "function" ? (defaultRow as () => unknown)() : structuredCloneRow(defaultRow));

  // Focus is set after the render that shows the change, once the target exists.
  useEffect(() => {
    const target = pending.current;
    if (!target) return;
    let el: HTMLElement | null = null;
    if (target.id === null) {
      el = addButton.current && !addButton.current.disabled ? addButton.current : null;
    } else {
      const row = root.current?.querySelector(`[data-rd-row-id="${target.id}"]`);
      if (!row) return; // not drawn yet; try again on the next render
      for (const action of target.prefer ?? []) {
        const button = row.querySelector<HTMLElement>(`[data-rd-action="${action}"]`);
        if (button && !(button as HTMLButtonElement).disabled) {
          el = button;
          break;
        }
      }
      el ??= firstFocusable(row.querySelector("[data-rd-row-content]"));
    }
    if (!el && target.fallbackToAdd) el = addButton.current;
    pending.current = null;
    el?.focus();
  });

  const add = () => {
    if (atMax) return;
    const id = newId();
    ids.current.push(id);
    pending.current = { id };
    array.push(makeRow() as never);
    announce(m.announceAdded(itemLabel, count + 1));
  };

  const insertBelow = (index: number) => {
    if (atMax) return;
    const id = newId();
    ids.current.splice(index + 1, 0, id);
    pending.current = { id };
    array.insert(index + 1, makeRow() as never);
    announce(m.announceAdded(itemLabel, index + 2));
  };

  const remove = (index: number) => {
    if (atMin) return;
    ids.current.splice(index, 1);
    // The row that slid into this place, else the one before it, else the Add button.
    const targetId = ids.current[index] ?? ids.current[index - 1];
    pending.current = targetId ? { id: targetId, prefer: ["remove"], fallbackToAdd: true } : { id: null };
    array.remove(index);
    announce(m.announceRemoved(itemLabel, index + 1));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= count) return;
    const [id] = ids.current.splice(from, 1);
    ids.current.splice(to, 0, id);
    // Keep focus on the button that was used; at the end of the list use the other one.
    pending.current = { id, prefer: to > from ? ["moveDown", "moveUp"] : ["moveUp", "moveDown"] };
    array.move(from, to);
    announce(m.announceMoved(itemLabel, to + 1, count));
  };

  return (
    <fieldset
      ref={root}
      data-rd-field={name}
      aria-describedby={cx(description && descriptionId, error && errorId, atMax && hintId) || undefined}
      className={cx("flex min-w-0 flex-col gap-3 border-0 p-0", className)}
    >
      <legend className={cx(fieldLabel, "mb-2 p-0")}>{label}</legend>
      {description && (
        <p id={descriptionId} className={fieldHelp}>
          {description}
        </p>
      )}

      {count === 0 ? (
        <p className="rounded-[var(--rd-radius-control)] border border-dashed border-[var(--rd-color-border-default)] px-3 py-4 text-center text-sm text-[var(--rd-color-text-muted)]">
          {emptyText}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ids.current.map((id, index) => {
            const n = index + 1;
            const row: FieldArrayRow = {
              index,
              id,
              count,
              isFirst: index === 0,
              isLast: index === count - 1,
              name: (path) => (path ? `${name}[${index}].${path}` : `${name}[${index}]`),
              remove: () => remove(index),
              moveUp: () => move(index, index - 1),
              moveDown: () => move(index, index + 1),
              insertBelow: () => insertBelow(index),
            };
            return (
              <li key={id}>
                <div
                  role="group"
                  aria-label={m.rowLabel(itemLabel, n)}
                  data-rd-row-id={id}
                  className={
                    "flex items-start gap-3 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] " +
                    "bg-[var(--rd-color-surface-default)] p-3 [box-shadow:var(--rd-elevation-raised)]"
                  }
                >
                  <div data-rd-row-content className="grid min-w-0 flex-1 gap-3">
                    {children(row)}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {allowReorder && (
                      <>
                        <AriaButton
                          data-rd-action="moveUp"
                          aria-label={m.moveUp(itemLabel, n)}
                          isDisabled={row.isFirst}
                          onPress={row.moveUp}
                          className={rowButton}
                        >
                          <ArrowUpIcon />
                        </AriaButton>
                        <AriaButton
                          data-rd-action="moveDown"
                          aria-label={m.moveDown(itemLabel, n)}
                          isDisabled={row.isLast}
                          onPress={row.moveDown}
                          className={rowButton}
                        >
                          <ArrowDownIcon />
                        </AriaButton>
                      </>
                    )}
                    {allowInsert && (
                      <AriaButton
                        data-rd-action="insertBelow"
                        aria-label={m.insertBelow(itemLabel, n)}
                        isDisabled={atMax}
                        onPress={row.insertBelow}
                        className={rowButton}
                      >
                        <PlusIcon />
                      </AriaButton>
                    )}
                    <AriaButton
                      data-rd-action="remove"
                      aria-label={m.remove(itemLabel, n)}
                      isDisabled={atMin}
                      onPress={row.remove}
                      className={rowButton}
                    >
                      <CloseIcon className="size-4" />
                    </AriaButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p id={errorId} className={fieldError}>
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button ref={addButton} variant="secondary" size="sm" isDisabled={atMax} onPress={add}>
          <PlusIcon />
          {addLabel}
        </Button>
        {atMax && maxRows !== undefined && (
          <span id={hintId} className={fieldHelp}>
            {m.maxReached(maxRows)}
          </span>
        )}
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
        {announceCount % 2 === 1 ? "" : " "}
      </div>
    </fieldset>
  );
}

/** A fresh copy for each added row, so rows never share one object. */
function structuredCloneRow(row: unknown): unknown {
  return row !== null && typeof row === "object" ? JSON.parse(JSON.stringify(row)) : row;
}
