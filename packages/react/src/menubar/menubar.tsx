"use client";

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  useMemo,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  Button as AriaButton,
  Header,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger,
  Popover,
  Separator,
  SubmenuTrigger,
  type Key,
  type Selection,
} from "react-aria-components";
import { menubarDefaults, type MenubarSpecProps } from "../generated/menubar.types";
import { Kbd } from "../kbd/kbd";
import { menuPanel } from "../menu/menu";
import { cx } from "../utils/cx";
import { CheckIcon, ChevronRightIcon } from "../utils/icons";

interface BarContext {
  openId: string | null;
  setOpenId: Dispatch<SetStateAction<string | null>>;
  activeId: string | null;
  setActiveId: (id: string) => void;
}

const BarCtx = createContext<BarContext | null>(null);
const IndexCtx = createContext(0);

const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

export interface MenubarProps extends MenubarSpecProps {
  className?: string;
}

/**
 * A bar of menus like File, Edit and View. Arrow keys move between the menus, and with one open they
 * open the neighbouring one. The menus themselves are React Aria menus.
 */
export const Menubar = forwardRef<HTMLDivElement, MenubarProps>(function Menubar({ label = menubarDefaults.label, children, className }, ref) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const value = useMemo(() => ({ openId, setOpenId, activeId, setActiveId }), [openId, activeId]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    const bar = event.currentTarget;
    const target = event.target as HTMLElement;
    const triggers = Array.from(bar.querySelectorAll<HTMLElement>("[data-rd-menubar-trigger]")).filter((el) => !el.hasAttribute("data-disabled"));
    const rtl = getComputedStyle(bar).direction === "rtl";
    const forward = event.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const backward = event.key === (rtl ? "ArrowRight" : "ArrowLeft");
    const home = event.key === "Home";
    const end = event.key === "End";

    const onTrigger = triggers.indexOf(target);
    let from = onTrigger;
    if (onTrigger === -1) {
      // The key came from an open menu (events bubble through the portal). Only a top-level menu hands over to its neighbour.
      if (home || end) return;
      const menu = target.closest<HTMLElement>('[role="menu"]');
      const open = triggers.find((el) => el.getAttribute("aria-expanded") === "true");
      if (!menu || !open || menu.getAttribute("aria-labelledby") !== open.id) return;
      // Right Arrow on an item that opens a submenu belongs to the submenu.
      if (forward && target.closest('[role="menuitem"]')?.hasAttribute("aria-haspopup")) return;
      from = triggers.indexOf(open);
    }
    if (from === -1) return;
    const next = home ? triggers[0] : end ? triggers[triggers.length - 1] : forward ? triggers[(from + 1) % triggers.length] : backward ? triggers[(from - 1 + triggers.length) % triggers.length] : undefined;
    if (!next) return;
    event.preventDefault();
    event.stopPropagation();
    const nextId = next.getAttribute("data-rd-menubar-trigger")!;
    next.focus();
    // With a menu open, the neighbour opens; with none open, focus just moves.
    if (value.openId) setOpenId(nextId);
  };

  return (
    <BarCtx.Provider value={value}>
      <div
        ref={ref}
        role="menubar"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cx("inline-flex items-center gap-0.5 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-1 text-[var(--rd-color-text-default)]", className)}
      >
        {Children.toArray(children).map((child, i) => (
          <IndexCtx.Provider key={isValidElement(child) && child.key != null ? child.key : i} value={i}>
            {child}
          </IndexCtx.Provider>
        ))}
      </div>
    </BarCtx.Provider>
  );
});

const itemBase =
  "group flex cursor-default items-center gap-2 rounded-[var(--rd-radius-control)] px-2.5 py-2 text-sm outline-none " +
  "data-[focused]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[disabled]:opacity-50";

export interface MenubarMenuProps {
  /** The text on the bar, e.g. File. */
  label: string;
  isDisabled?: boolean;
  children: ReactNode;
  className?: string;
}

/** One menu in the bar: a trigger and the list it opens. Holds MenubarItem, MenubarGroup, MenubarSubmenu and MenubarSeparator. */
export function MenubarMenu({ label, isDisabled, children, className }: MenubarMenuProps) {
  const bar = useContext(BarCtx);
  if (!bar) throw new Error("MenubarMenu must be used inside Menubar.");
  const id = useId();
  const index = useContext(IndexCtx);
  const isOpen = bar.openId === id;
  // One tab stop for the whole bar: the menu last focused, or the first.
  const tabStop = bar.activeId ? bar.activeId === id : index === 0;
  return (
    <MenuTrigger isOpen={isOpen} onOpenChange={(open) => bar.setOpenId((cur) => (open ? id : cur === id ? null : cur))}>
      <AriaButton
        isDisabled={isDisabled}
        data-rd-menubar-trigger={id}
        data-open={isOpen || undefined}
        ref={(node) => node?.setAttribute("role", "menuitem")}
        excludeFromTabOrder={!tabStop}
        onFocus={() => bar.setActiveId(id)}
        onHoverStart={() => {
          // With a menu open, pointing at another one switches to it.
          if (bar.openId && bar.openId !== id) bar.setOpenId(id);
        }}
        className={cx(
          "rounded-[var(--rd-radius-control)] px-3 py-1.5 text-sm text-[var(--rd-color-text-default)] transition-colors motion-reduce:transition-none",
          "data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[open]:bg-[var(--rd-color-surface-subtle)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          focusRing,
        )}
      >
        {label}
      </AriaButton>
      <Popover placement="bottom start" offset={6} className={cx(menuPanel, "min-w-52 overflow-auto p-1.5")}>
        <AriaMenu aria-label={label} autoFocus="first" className={cx("flex flex-col outline-none", className)}>
          {children}
        </AriaMenu>
      </Popover>
    </MenuTrigger>
  );
}

function Shortcut({ keys }: { keys: string | string[] }) {
  const list = Array.isArray(keys) ? keys : [keys];
  return (
    <span className="ms-6 flex shrink-0 items-center gap-1">
      {list.map((key, i) => (
        <Kbd key={`${key}-${i}`} size="sm">
          {key}
        </Kbd>
      ))}
    </span>
  );
}

export interface MenubarItemProps {
  /** Identifies the item in onAction and in a group's selected keys. */
  id?: Key;
  children: ReactNode;
  /** Keys shown at the end, e.g. ["⌘", "S"]. A hint only: wire the shortcut yourself. */
  shortcut?: string | string[];
  isDisabled?: boolean;
  /** Called when the item is chosen. */
  onAction?: () => void;
  /** Spoken name when the content is not plain text. */
  textValue?: string;
  className?: string;
}

/** An action in a menu. Inside a MenubarGroup with a selection mode it is a checkbox or radio item. */
export function MenubarItem({ id, children, shortcut, isDisabled, onAction, textValue, className }: MenubarItemProps) {
  return (
    <AriaMenuItem
      id={id}
      isDisabled={isDisabled}
      onAction={onAction}
      textValue={textValue ?? (typeof children === "string" ? children : undefined)}
      className={cx(itemBase, "text-[var(--rd-color-text-default)]", className)}
    >
      {({ selectionMode, isSelected }) => (
        <>
          {selectionMode !== "none" && (
            <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
              {isSelected && (selectionMode === "single" ? <span className="size-1.5 rounded-full bg-[var(--rd-color-text-default)]" /> : <CheckIcon />)}
            </span>
          )}
          <span className="flex-1 truncate">{children}</span>
          {shortcut && <Shortcut keys={shortcut} />}
        </>
      )}
    </AriaMenuItem>
  );
}

export interface MenubarGroupProps {
  /** none for plain actions, multiple for checkbox items, single for radio items. */
  selectionMode?: "none" | "single" | "multiple";
  selectedKeys?: Iterable<Key>;
  defaultSelectedKeys?: Iterable<Key>;
  onSelectionChange?: (keys: Set<Key>) => void;
  /** Visible heading for the group. Without one, give an aria-label. */
  title?: string;
  "aria-label"?: string;
  children: ReactNode;
}

/** A set of items that share a selection mode, for checkbox items or a radio set. */
export function MenubarGroup({ selectionMode = "none", selectedKeys, defaultSelectedKeys, onSelectionChange, title, children, ...rest }: MenubarGroupProps) {
  const handle = onSelectionChange
    ? (keys: Selection) => onSelectionChange(keys === "all" ? new Set<Key>() : new Set(keys))
    : undefined;
  return (
    <AriaMenuSection
      aria-label={rest["aria-label"] ?? title}
      selectionMode={selectionMode}
      selectedKeys={selectedKeys}
      defaultSelectedKeys={defaultSelectedKeys}
      onSelectionChange={handle}
      className="flex flex-col"
    >
      {title && <Header className="px-2.5 pt-2 pb-1 text-xs font-medium text-[var(--rd-color-text-muted)]">{title}</Header>}
      {children}
    </AriaMenuSection>
  );
}

export interface MenubarSubmenuProps {
  label: string;
  isDisabled?: boolean;
  children: ReactNode;
}

/** An item that opens a second list to its side. Keep it to one level. */
export function MenubarSubmenu({ label, isDisabled, children }: MenubarSubmenuProps) {
  return (
    <SubmenuTrigger>
      <AriaMenuItem isDisabled={isDisabled} textValue={label} className={cx(itemBase, "text-[var(--rd-color-text-default)]")}>
        <span className="flex-1 truncate">{label}</span>
        <ChevronRightIcon className="size-4 shrink-0 text-[var(--rd-color-text-muted)] rtl:rotate-180" />
      </AriaMenuItem>
      <Popover className={cx(menuPanel, "min-w-48 overflow-auto p-1.5")}>
        <AriaMenu aria-label={label} className="flex flex-col outline-none">
          {children}
        </AriaMenu>
      </Popover>
    </SubmenuTrigger>
  );
}

export function MenubarSeparator() {
  return <Separator className="my-1.5 border-t border-[var(--rd-color-border-default)]" />;
}
