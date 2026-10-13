"use client";

import { createContext, forwardRef, useCallback, useContext, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Button as AriaButton, Link as AriaLink, Tooltip as AriaTooltip, TooltipTrigger } from "react-aria-components";
import { dockDefaults, type DockSpecProps } from "../generated/dock.types";
import { cx } from "../utils/cx";
import { prefersReducedMotion, useIsomorphicLayoutEffect } from "../utils/motion";

const ITEMS = "[data-rdm-dock-item]:not([data-disabled])";
const DockContext = createContext<"horizontal" | "vertical">("horizontal");

export interface DockProps extends DockSpecProps, Omit<React.HTMLAttributes<HTMLDivElement>, keyof DockSpecProps | "role" | "aria-label"> {
  className?: string;
}

/**
 * A toolbar of icon buttons that grow toward the pointer. Arrow keys move between items (roving focus),
 * the focused item grows too, and magnification is off for touch, reduced motion and isPaused.
 */
export const Dock = forwardRef<HTMLDivElement, DockProps>(function Dock(
  {
    children,
    label,
    orientation = dockDefaults.orientation,
    magnification = dockDefaults.magnification,
    distance = dockDefaults.distance,
    isPaused = dockDefaults.isPaused,
    className,
    onKeyDown,
    onPointerMove,
    onPointerLeave,
    onFocus,
    style,
    ...rest
  },
  ref,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const vertical = orientation === "vertical";

  const items = () => Array.from(root.current?.querySelectorAll<HTMLElement>(ITEMS) ?? []);
  // One tab stop: the given item (or the one that already has it, or the first) is reachable by Tab.
  const setTab = (target?: HTMLElement) => {
    const list = items();
    const active = target ?? list.find((el) => el.tabIndex === 0) ?? list[0];
    for (const el of list) el.tabIndex = el === active ? 0 : -1;
  };
  // Re-applied after every render, since items can come and go.
  useIsomorphicLayoutEffect(() => {
    setTab(items().find((el) => el === document.activeElement));
  });

  const reset = useCallback(() => {
    for (const el of Array.from(root.current?.querySelectorAll<HTMLElement>("[data-rdm-dock-item]") ?? [])) el.style.removeProperty("--rdm-dock-s");
  }, []);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    if (e.pointerType === "touch" || isPaused || magnification <= 1 || prefersReducedMotion() || root.current?.closest(".rdm-still")) {
      reset();
      return;
    }
    const pointer = vertical ? e.clientY : e.clientX;
    for (const el of items()) {
      const rect = el.getBoundingClientRect();
      const centre = vertical ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
      const t = Math.max(0, 1 - Math.abs(pointer - centre) / distance);
      // Smooth falloff: the full scale under the pointer, easing to the resting size at `distance`.
      const scale = 1 + (magnification - 1) * Math.pow(Math.sin((t * Math.PI) / 2), 2);
      el.style.setProperty("--rdm-dock-s", scale.toFixed(3));
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const next = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
    const prev = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    const list = items();
    const index = list.findIndex((el) => el === document.activeElement);
    if (index < 0) return;
    let to = -1;
    if (e.key === next) to = (index + 1) % list.length;
    else if (e.key === prev) to = (index - 1 + list.length) % list.length;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = list.length - 1;
    if (to < 0) return;
    e.preventDefault();
    setTab(list[to]);
    list[to].focus();
  };

  return (
    <DockContext.Provider value={orientation}>
      <div
        {...rest}
        ref={(node) => {
          root.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        role="toolbar"
        aria-label={label}
        aria-orientation={orientation}
        data-orientation={orientation}
        data-rdm-paused={isPaused || undefined}
        style={{ ...({ "--rdm-dock-m": Math.max(1, magnification) } as React.CSSProperties), ...style }}
        onKeyDown={handleKey}
        onPointerMove={handleMove}
        onPointerLeave={(e) => {
          onPointerLeave?.(e);
          reset();
        }}
        onFocus={(e) => {
          onFocus?.(e);
          const target = (e.target as HTMLElement).closest<HTMLElement>("[data-rdm-dock-item]");
          if (target) setTab(target);
        }}
        className={cx(
          "rdm-dock inline-flex gap-2 p-2 border border-[var(--rd-color-border-default)] bg-[color-mix(in_srgb,var(--rd-color-surface-raised)_82%,transparent)] backdrop-blur-md [box-shadow:var(--rd-elevation-raised)] rounded-[1.5rem]",
          vertical ? "flex-col items-start" : "flex-row items-end",
          className,
        )}
      >
        {children}
      </div>
    </DockContext.Provider>
  );
});

export interface DockItemProps {
  /** The icon. Decorative: the label is the accessible name. */
  children: ReactNode;
  /** Names the item: shown as a tooltip and used as its accessible name. */
  label: string;
  /** Makes the item a link. Without it the item is a button. */
  href?: string;
  onPress?: () => void;
  isDisabled?: boolean;
  className?: string;
}

const itemClass =
  "rdm-dock-item inline-flex items-center justify-center rounded-full " +
  "bg-[var(--rd-color-surface-subtle)] text-[var(--rd-color-text-default)] hover:bg-[var(--rd-color-surface-default)] outline-none cursor-pointer " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed";

/** One icon button (or link) in a Dock. */
export const DockItem = forwardRef<HTMLElement, DockItemProps>(function DockItem({ children, label, href, onPress, isDisabled, className }, ref) {
  const orientation = useContext(DockContext);
  const common = {
    "aria-label": label,
    "data-rdm-dock-item": "",
    isDisabled,
    className: cx(itemClass, className),
  };
  const icon = (
    <span aria-hidden="true" className="inline-flex">
      {children}
    </span>
  );
  return (
    <TooltipTrigger delay={200} closeDelay={0}>
      {href ? (
        <AriaLink {...common} ref={ref as React.Ref<HTMLAnchorElement>} href={href} onPress={onPress}>
          {icon}
        </AriaLink>
      ) : (
        <AriaButton {...common} ref={ref as React.Ref<HTMLButtonElement>} type="button" onPress={onPress}>
          {icon}
        </AriaButton>
      )}
      <AriaTooltip
        placement={orientation === "vertical" ? "end" : "top"}
        offset={12}
        className="px-2.5 py-1.5 text-xs font-medium bg-[var(--rd-color-text-default)] text-[var(--rd-color-surface-default)] rounded-[var(--rd-radius-control)] [box-shadow:var(--rd-elevation-floating)]"
      >
        {label}
      </AriaTooltip>
    </TooltipTrigger>
  );
});
