"use client";

import {
  createElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Menu as AriaMenu, Popover, VisuallyHidden } from "react-aria-components";
import { contextMenuDefaults, type ContextMenuSpecProps } from "../generated/context-menu.types";
import { MenuItem, MenuSection, MenuSeparator, menuPanel } from "../menu/menu";
import type { MenuItemProps, MenuSectionProps } from "../menu/menu";
import { cx } from "../utils/cx";

// The menu's parts are the Menu parts: one look, one set of props.
export {
  MenuItem as ContextMenuItem,
  MenuSection as ContextMenuSection,
  MenuSeparator as ContextMenuSeparator,
};
export type ContextMenuItemProps = MenuItemProps;
export type ContextMenuSectionProps = MenuSectionProps;

export interface ContextMenuProps extends ContextMenuSpecProps {
  className?: string;
}

interface Opened {
  x: number;
  y: number;
  by: "pointer" | "keyboard";
}

const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 10;

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName));

/**
 * The menu that opens at the pointer over an area: a right click, a long press on touch, or
 * Shift+F10 and the Menu key on the focused area. Everything in it must also be possible some
 * other visible way; this is a shortcut, never the only door.
 */
export function ContextMenu({
  label,
  children,
  items,
  hint = contextMenuDefaults.hint,
  onAction,
  selectionMode = contextMenuDefaults.selectionMode,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  isDisabled = contextMenuDefaults.isDisabled,
  elementType = contextMenuDefaults.elementType,
  className,
}: ContextMenuProps) {
  const [opened, setOpened] = useState<Opened | null>(null);
  const [mounted, setMounted] = useState(false);
  const areaRef = useRef<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const hintId = useId();
  const press = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);

  useEffect(() => setMounted(true), []);

  const cancelPress = useCallback(() => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  }, []);
  useEffect(() => cancelPress, [cancelPress]);

  // Whatever way the menu closed, the person lands back on the area they came from.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (opened) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!active || active === document.body) areaRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [opened]);

  if (isDisabled) {
    return createElement(elementType, { className }, children);
  }

  const openAt = (x: number, y: number, by: Opened["by"]) => setOpened({ x, y, by });

  const onContextMenu = (e: ReactMouseEvent) => {
    if (isEditable(e.target)) return;
    e.preventDefault();
    if (opened) return;
    // A menu opened with the Menu key sends a contextmenu event without a real position.
    if (e.clientX === 0 && e.clientY === 0) {
      const r = (e.target as HTMLElement).getBoundingClientRect();
      openAt(r.left + 16, r.top + Math.min(r.height, 32), "keyboard");
    } else {
      openAt(e.clientX, e.clientY, "pointer");
    }
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
      if (isEditable(e.target)) return;
      e.preventDefault();
      const r = (e.target as HTMLElement).getBoundingClientRect();
      openAt(r.left + 16, r.top + Math.min(r.height, 32), "keyboard");
    }
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType !== "touch" || !e.isPrimary) return;
    cancelPress();
    const x = e.clientX;
    const y = e.clientY;
    press.current = {
      x,
      y,
      timer: setTimeout(() => {
        press.current = null;
        openAt(x, y, "pointer");
      }, LONG_PRESS_MS),
    };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const p = press.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > LONG_PRESS_SLOP) cancelPress();
  };

  const close = () => setOpened(null);

  return (
    <>
      {createElement(
        elementType,
        {
          ref: (node: HTMLElement | null) => {
            areaRef.current = node;
          },
          className: cx(
            "outline-none focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-[var(--rd-color-focus-ring)]",
            className,
          ),
          style: { WebkitTouchCallout: "none" },
          tabIndex: 0,
          "aria-describedby": mounted ? hintId : undefined,
          "aria-keyshortcuts": "Shift+F10",
          onContextMenu,
          onKeyDown,
          onPointerDown,
          onPointerMove,
          onPointerUp: cancelPress,
          onPointerCancel: cancelPress,
        },
        children,
      )}
      {mounted &&
        createPortal(
          <>
            <VisuallyHidden>
              <span id={hintId}>{hint}</span>
            </VisuallyHidden>
            {opened && (
              <span
                ref={anchorRef}
                aria-hidden="true"
                className="pointer-events-none fixed size-0"
                style={{ left: opened.x, top: opened.y }}
              />
            )}
          </>,
          document.body,
        )}
      {opened && (
        <Popover
          triggerRef={anchorRef}
          isOpen
          onOpenChange={(open) => {
            if (!open) close();
          }}
          aria-label={label}
          placement="bottom start"
          offset={0}
          className={cx(menuPanel, "min-w-48 overflow-auto p-1.5")}
        >
          <AriaMenu
            aria-label={label}
            autoFocus={opened.by === "keyboard" ? "first" : true}
            onAction={onAction ? (key) => onAction(key) : undefined}
            onClose={close}
            selectionMode={selectionMode === "none" ? undefined : selectionMode}
            selectedKeys={selectedKeys}
            defaultSelectedKeys={defaultSelectedKeys}
            onSelectionChange={onSelectionChange}
            className="flex flex-col outline-none"
          >
            {items}
          </AriaMenu>
        </Popover>
      )}
    </>
  );
}
