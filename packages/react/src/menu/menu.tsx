"use client";

import type { ReactNode } from "react";
import {
  Header,
  Keyboard,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger,
  Popover,
  Separator,
  type MenuItemProps as AriaMenuItemProps,
  type MenuProps as AriaMenuProps,
} from "react-aria-components";
import { menuDefaults, type MenuSpecProps } from "../generated/menu.types";
import { cx } from "../utils/cx";
import { overlayPanel } from "../utils/field";
import { CheckIcon } from "../utils/icons";

export { MenuTrigger };

export interface MenuProps<T extends object = object>
  extends MenuSpecProps,
    Omit<AriaMenuProps<T>, keyof MenuSpecProps | "className" | "children"> {
  className?: string;
}

export function Menu<T extends object = object>({
  placement = menuDefaults.placement,
  selectionMode = menuDefaults.selectionMode,
  children,
  className,
  ...rest
}: MenuProps<T>) {
  return (
    <Popover placement={placement} offset={6} className={cx(overlayPanel, "min-w-48 overflow-auto p-1")}>
      <AriaMenu<T>
        {...rest}
        selectionMode={selectionMode === "none" ? undefined : selectionMode}
        className={cx("flex flex-col outline-none", className)}
      >
        {children}
      </AriaMenu>
    </Popover>
  );
}

export interface MenuItemProps extends Omit<AriaMenuItemProps, "className" | "children"> {
  className?: string;
  children: ReactNode;
  /** Shortcut hint shown on the right, e.g. "⌘D". Display only: wire the shortcut yourself. */
  shortcut?: string;
  /** Destructive actions like Delete: shown in the danger color. Say what it does in the text too. */
  variant?: "default" | "danger";
}

export function MenuItem({ className, children, shortcut, variant = "default", ...rest }: MenuItemProps) {
  const textValue = rest.textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <AriaMenuItem
      {...rest}
      textValue={textValue}
      className={cx(
        "group flex cursor-default items-center gap-2 rounded-[var(--rd-radius-control)] px-2.5 py-1.5 text-sm outline-none",
        "data-[focused]:bg-[var(--rd-color-surface-subtle)] data-[disabled]:opacity-50",
        variant === "danger" ? "text-[var(--rd-color-feedback-danger)]" : "text-[var(--rd-color-text-default)]",
        className,
      )}
    >
      {({ selectionMode, isSelected }) => (
        <>
          {selectionMode !== "none" && (
            <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
              {isSelected && <CheckIcon />}
            </span>
          )}
          <span className="flex-1 truncate">{children}</span>
          {shortcut && (
            <Keyboard className="ms-4 font-sans text-xs text-[var(--rd-color-text-muted)]">{shortcut}</Keyboard>
          )}
        </>
      )}
    </AriaMenuItem>
  );
}

export interface MenuSectionProps {
  /** Visible heading, read by screen readers when moving into the section. */
  title?: string;
  children: ReactNode;
  className?: string;
}

export function MenuSection({ title, children, className }: MenuSectionProps) {
  return (
    <AriaMenuSection className={cx("flex flex-col", className)}>
      {title && <Header className="px-2.5 pt-2 pb-1 text-xs font-medium text-[var(--rd-color-text-muted)]">{title}</Header>}
      {children}
    </AriaMenuSection>
  );
}

export function MenuSeparator() {
  return <Separator className="my-1 border-t border-[var(--rd-color-border-default)]" />;
}
