"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";
import { Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from "../menu/menu";
import { cx } from "../utils/cx";
import { CheckIcon, ChevronDownIcon, DotsIcon, GripIcon } from "../utils/icons";

// The pieces of the grid that open or drag: the header's column menu, the
// set filter's value picker, and the row drag handle. They sit in grid cells
// but are not tab stops: the grid's own keyboard handling reaches them
// (Alt+Down on a header opens its menu, Enter on a filter cell opens its
// picker, Alt+Up/Down on a row moves it).

const smallButton =
  "inline-flex size-6 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] outline-none " +
  "text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-surface-default)] data-[hovered]:text-[var(--rd-color-text-default)] " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

export type ColumnMenuAction = "asc" | "desc" | "clear-sort" | "pin" | "unpin" | "hide" | "reset-width" | `show:${string}`;

export interface ColumnMenuProps {
  /** The column's header text, for the labels. */
  name: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sorted: false | "asc" | "desc";
  canSort: boolean;
  canPin: boolean;
  isPinned: boolean;
  canHide: boolean;
  canResize: boolean;
  /** Columns the user has hidden, offered as "Show <name>". */
  hidden: { id: string; name: string }[];
  onAction: (action: ColumnMenuAction) => void;
}

export function ColumnMenu(p: ColumnMenuProps) {
  const sortItems = p.canSort;
  const layoutItems = p.canPin || p.canHide || p.canResize;
  return (
    <MenuTrigger isOpen={p.isOpen} onOpenChange={p.onOpenChange}>
      <AriaButton data-widget="" excludeFromTabOrder aria-label={`${p.name} column menu`} className={smallButton}>
        <DotsIcon />
      </AriaButton>
      <Menu placement="bottom end" onAction={(key) => p.onAction(String(key) as ColumnMenuAction)}>
        {sortItems && (
          <MenuSection>
            <MenuItem key="asc" id="asc">Sort ascending{p.sorted === "asc" ? " (current)" : ""}</MenuItem>
            <MenuItem key="desc" id="desc">Sort descending{p.sorted === "desc" ? " (current)" : ""}</MenuItem>
            {p.sorted && (
              <MenuItem key="clear-sort" id="clear-sort">
                Clear sort
              </MenuItem>
            )}
          </MenuSection>
        )}
        {sortItems && layoutItems && <MenuSeparator />}
        {layoutItems && (
          <MenuSection>
            {p.canPin &&
              (p.isPinned ? (
                <MenuItem key="unpin" id="unpin">
                  Unpin column
                </MenuItem>
              ) : (
                <MenuItem key="pin" id="pin">
                  Pin to the left
                </MenuItem>
              ))}
            {p.canResize && (
              <MenuItem key="reset-width" id="reset-width">
                Reset width
              </MenuItem>
            )}
            {p.canHide && (
              <MenuItem key="hide" id="hide">
                Hide column
              </MenuItem>
            )}
          </MenuSection>
        )}
        {p.hidden.length > 0 && <MenuSeparator />}
        {p.hidden.length > 0 && (
          <MenuSection title="Hidden columns">
            {p.hidden.map((c) => (
              <MenuItem key={c.id} id={`show:${c.id}`}>
                {`Show ${c.name}`}
              </MenuItem>
            ))}
          </MenuSection>
        )}
      </Menu>
    </MenuTrigger>
  );
}

export interface SetFilterProps {
  /** Accessible name, e.g. "Filter Status". */
  label: string;
  options: readonly string[];
  /** The chosen values; empty means no filter. */
  value: readonly string[];
  /** Called with the new choice, or undefined to clear the filter. */
  onChange: (value: string[] | undefined) => void;
  className?: string;
}

/** A filter that offers the column's values as a checklist, like a spreadsheet's. */
export function SetFilter({ label, options, value, onChange, className }: SetFilterProps) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const shown = needle ? options.filter((o) => o.toLocaleLowerCase().includes(needle)) : options;
  const summary = value.length === 0 ? "All" : value.length === 1 ? value[0] : `${value.length} selected`;
  return (
    <DialogTrigger>
      <AriaButton
        data-widget=""
        excludeFromTabOrder
        aria-label={label}
        className={cx(
          "flex h-7 w-full items-center justify-between gap-1 rounded-[var(--rd-radius-control)] border px-2 text-start text-sm outline-none",
          "border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)]",
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
          value.length > 0 && "font-medium",
          className,
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDownIcon />
      </AriaButton>
      <Popover
        placement="bottom start"
        className={
          "w-56 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] " +
          "bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-floating)]"
        }
      >
        <Dialog aria-label={label} className="flex flex-col gap-1 p-2 outline-none">
          {options.length > 8 && (
            <input
              type="search"
              autoFocus // long lists start in the search box; short ones start on the first value
              aria-label={`Search ${label.replace(/^Filter /, "")} values`}
              placeholder="Search values"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={
                "h-8 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] " +
                "bg-[var(--rd-color-surface-default)] px-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rd-color-focus-ring)]"
              }
            />
          )}
          <ListBox
            aria-label={label}
            autoFocus={options.length > 8 ? false : "first"}
            selectionMode="multiple"
            escapeKeyBehavior="none" // Escape closes the picker; it must not also clear what was ticked
            selectedKeys={new Set(value)}
            onSelectionChange={(keys) => {
              const next = keys === "all" ? [...options] : [...keys].map(String);
              onChange(next.length ? next : undefined);
            }}
            renderEmptyState={() => <p className="px-2.5 py-1.5 text-sm text-[var(--rd-color-text-muted)]">No matching values</p>}
            className="flex max-h-56 flex-col overflow-auto outline-none"
          >
            {shown.map((option) => (
              <ListBoxItem
                key={option}
                id={option}
                textValue={option}
                className={
                  "flex cursor-default items-center gap-2 rounded-[var(--rd-radius-control)] px-2.5 py-1.5 text-sm outline-none " +
                  "data-[focused]:bg-[var(--rd-color-surface-subtle)]"
                }
              >
                {({ isSelected }) => (
                  <>
                    <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
                      {isSelected && <CheckIcon />}
                    </span>
                    <span className="truncate">{option || "(empty)"}</span>
                  </>
                )}
              </ListBoxItem>
            ))}
          </ListBox>
          <AriaButton
            isDisabled={value.length === 0}
            onPress={() => onChange(undefined)}
            className={
              "h-8 rounded-[var(--rd-radius-control)] px-2 text-sm text-[var(--rd-color-text-default)] outline-none " +
              "data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[disabled]:opacity-50 " +
              "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
            }
          >
            Clear filter
          </AriaButton>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

export interface RowHandleProps {
  /** Row name, for the label. */
  name: string;
  canReorder: boolean;
  onDragStart: (e: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

/** The grip a row is dragged by. Keyboard users move rows with Alt+Up and Alt+Down instead. */
export function RowHandle({ name, canReorder, onDragStart, onDragEnd }: RowHandleProps): ReactNode {
  return (
    <span
      role="img"
      draggable={canReorder}
      aria-label={canReorder ? `Reorder ${name}. Alt+Up or Alt+Down moves it.` : "Reordering is off while the grid is sorted or filtered"}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cx(
        "flex size-6 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-muted)]",
        canReorder ? "cursor-grab active:cursor-grabbing hover:bg-[var(--rd-color-surface-subtle)]" : "cursor-not-allowed opacity-40",
      )}
    >
      <GripIcon />
    </span>
  );
}
