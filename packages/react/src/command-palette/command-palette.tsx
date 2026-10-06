"use client";

import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Autocomplete,
  Dialog,
  Header,
  Input,
  Menu,
  MenuItem,
  MenuSection,
  Modal,
  ModalOverlay,
  SearchField,
  useFilter,
  type Key,
} from "react-aria-components";
import { commandPaletteDefaults, type CommandPaletteSpecProps } from "../generated/command-palette.types";
import { Kbd } from "../kbd/kbd";
import { cx } from "../utils/cx";
import { SearchIcon } from "../utils/icons";

export interface CommandPaletteProps extends CommandPaletteSpecProps {
  className?: string;
}

export const CommandPalette = forwardRef<HTMLDivElement, CommandPaletteProps>(function CommandPalette(
  {
    label,
    children,
    isOpen,
    defaultOpen = commandPaletteDefaults.defaultOpen,
    onOpenChange,
    placeholder = commandPaletteDefaults.placeholder,
    emptyMessage = commandPaletteDefaults.emptyMessage,
    shortcut = commandPaletteDefaults.shortcut,
    onAction,
    className,
  },
  ref,
) {
  const [inner, setInner] = useState(defaultOpen);
  const open = isOpen ?? inner;
  const setOpen = (next: boolean) => {
    if (isOpen === undefined) setInner(next);
    onOpenChange?.(next);
  };

  // The shortcut handler lives for the whole page, so it reads the latest state through a ref.
  const toggle = useRef(() => {});
  toggle.current = () => setOpen(!open);
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLocaleLowerCase() === shortcut.toLocaleLowerCase()) {
        e.preventDefault(); // Ctrl+K would otherwise focus the browser's search box
        toggle.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const { contains } = useFilter({ sensitivity: "base" });

  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={setOpen}
      isDismissable
      className={
        "fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] " +
        "bg-[var(--rd-color-overlay-backdrop)] backdrop-blur-[2px] transition-opacity duration-150 " +
        "data-[entering]:opacity-0 data-[exiting]:opacity-0 motion-reduce:transition-none"
      }
    >
      <Modal
        className={cx(
          "w-full max-w-xl overflow-hidden rounded-[calc(var(--rd-radius-overlay)+4px)] border border-[var(--rd-color-border-default)] " +
            "bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] " +
            "[box-shadow:var(--rd-elevation-overlay)] " +
            "transition duration-150 ease-out data-[entering]:translate-y-1 data-[entering]:scale-[0.98] data-[entering]:opacity-0 " +
            "data-[exiting]:scale-[0.98] data-[exiting]:opacity-0 motion-reduce:transition-none",
          className,
        )}
      >
        <Dialog ref={ref} aria-label={label} className="flex flex-col outline-none">
          <Autocomplete filter={contains}>
            <SearchField autoFocus aria-label={placeholder} className="flex items-center gap-3 border-b border-[var(--rd-color-border-default)] px-4">
              <SearchIcon className="size-5 shrink-0 text-[var(--rd-color-text-muted)]" />
              <Input
                placeholder={placeholder}
                className="h-14 min-w-0 flex-1 bg-transparent text-base text-[var(--rd-color-text-default)] outline-none placeholder:text-[var(--rd-color-text-muted)] [&::-webkit-search-cancel-button]:hidden"
              />
              <Kbd size="sm" aria-hidden="true">
                Esc
              </Kbd>
            </SearchField>
            <Menu
              aria-label={label}
              onAction={(key: Key) => {
                onAction?.(key);
                setOpen(false);
              }}
              renderEmptyState={() => <p className="px-3 py-10 text-center text-sm text-[var(--rd-color-text-muted)]">{emptyMessage}</p>}
              className="max-h-[min(24rem,55vh)] overflow-y-auto p-2 outline-none"
            >
              {children}
            </Menu>
          </Autocomplete>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
});

export interface CommandGroupProps {
  /** Heading of the group, e.g. "Navigation". */
  title: string;
  children: ReactNode;
}

export function CommandGroup({ title, children }: CommandGroupProps) {
  return (
    <MenuSection className="flex flex-col pb-1 last:pb-0">
      <Header className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-[var(--rd-color-text-muted)] uppercase">{title}</Header>
      {children}
    </MenuSection>
  );
}

export interface CommandItemProps {
  /** Identifies the command in onAction. */
  id: Key;
  children: ReactNode;
  /** Plain-text name for searching and screen readers. Needed when children isn't a string. */
  textValue?: string;
  /** Icon shown before the name. Decorative. */
  icon?: ReactNode;
  /** Shortcut hint, keys separated by spaces: "G D" or "Ctrl N". Display only: wire the shortcut yourself. */
  shortcut?: string;
  /** Extra words to match when searching, e.g. synonyms. */
  keywords?: string;
  onAction?: () => void;
}

export function CommandItem({ id, children, textValue, icon, shortcut, keywords, onAction }: CommandItemProps) {
  const text = textValue ?? (typeof children === "string" ? children : String(id));
  return (
    <MenuItem
      id={id}
      // Matching reads textValue, so synonyms ride along after the name.
      textValue={keywords ? `${text} ${keywords}` : text}
      aria-label={text}
      onAction={onAction}
      className={
        "flex cursor-default items-center gap-3 rounded-[var(--rd-radius-control)] px-3 py-2.5 text-sm outline-none " +
        "text-[var(--rd-color-text-default)] data-[focused]:bg-[var(--rd-color-surface-subtle)] data-[pressed]:bg-[var(--rd-color-surface-selected)]"
      }
    >
      {icon && (
        <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center text-[var(--rd-color-text-muted)] [&>svg]:size-5">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && (
        <span aria-hidden="true" className="flex shrink-0 items-center gap-1">
          {shortcut.split(" ").map((key, i) => (
            <Kbd key={`${key}-${i}`} size="sm">
              {key}
            </Kbd>
          ))}
        </span>
      )}
    </MenuItem>
  );
}
