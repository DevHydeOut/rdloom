"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Button as AriaButton, Link as AriaLink } from "react-aria-components";
import { navigationMenuDefaults, type NavigationMenuSpecProps } from "../generated/navigation-menu.types";
import { cx } from "../utils/cx";
import { ChevronDownIcon } from "../utils/icons";

interface RootContext {
  openId: string | null;
  open: (id: string, delayed: boolean) => void;
  close: (delayed: boolean) => void;
  toggle: (id: string, pointerType: string) => void;
}

const RootCtx = createContext<RootContext | null>(null);
const ItemCtx = createContext<{ id: string; triggerId: string; contentId: string } | null>(null);
const InPanelCtx = createContext(false);
const AlignCtx = createContext<"start" | "center" | "end">("start");

const panelAlign = {
  start: "start-0",
  center: "start-1/2 -translate-x-1/2 rtl:translate-x-1/2",
  end: "end-0",
} as const;

function useRoot(part: string): RootContext {
  const ctx = useContext(RootCtx);
  if (!ctx) throw new Error(`${part} must be used inside NavigationMenu.`);
  return ctx;
}

const esc = (value: string) => value.replace(/["\\]/g, "\\$&");
const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";
const topBase =
  "relative flex min-h-[var(--rd-size-control-sm)] items-center gap-1.5 rounded-[var(--rd-radius-control)] px-3 py-1.5 text-sm whitespace-nowrap text-[var(--rd-color-text-muted)] transition-colors " +
  "data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] data-[open]:bg-[var(--rd-color-surface-subtle)] data-[open]:text-[var(--rd-color-text-default)] motion-reduce:transition-none " +
  focusRing;
// The current page: a heavier label and a bar under it, so it is not shown by color alone.
const topCurrent =
  "font-medium !text-[var(--rd-color-text-default)] after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-[var(--rd-color-text-default)]";

export interface NavigationMenuProps extends NavigationMenuSpecProps {
  className?: string;
}

/**
 * Site navigation along the top of a page. Links sit in the bar; a trigger opens a shared panel of
 * grouped links below it. Hover opens a panel after a short delay; click and keyboard open it at once.
 */
export const NavigationMenu = forwardRef<HTMLElement, NavigationMenuProps>(function NavigationMenu(
  { label = navigationMenuDefaults.label, delay = navigationMenuDefaults.delay, align = navigationMenuDefaults.align, children, className },
  forwardedRef,
) {
  const root = useRef<HTMLElement | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hoverOpened = useRef(false);
  const pendingFocus = useRef<string | null>(null);
  const pointerInside = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const open = useCallback(
    (id: string, delayed: boolean) => {
      cancel();
      if (delayed) {
        hoverOpened.current = true;
        timer.current = setTimeout(() => setOpenId(id), delay);
      } else {
        setOpenId(id);
      }
    },
    [cancel, delay],
  );
  const close = useCallback(
    (delayed: boolean) => {
      cancel();
      hoverOpened.current = false;
      if (delayed) timer.current = setTimeout(() => setOpenId(null), delay);
      else setOpenId(null);
    },
    [cancel, delay],
  );
  const toggle = useCallback(
    (id: string, pointerType: string) => {
      cancel();
      // A click on a trigger the pointer just opened keeps it open instead of closing it again.
      if (openId === id && pointerType === "mouse" && hoverOpened.current) {
        hoverOpened.current = false;
        return;
      }
      hoverOpened.current = false;
      setOpenId(openId === id ? null : id);
    },
    [cancel, openId],
  );

  useEffect(() => () => cancel(), [cancel]);

  // A click outside closes the panel.
  useEffect(() => {
    if (!openId) return;
    const onDown = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [openId, close]);

  // Down Arrow on a trigger opens the panel and moves into it.
  useEffect(() => {
    if (openId && pendingFocus.current === openId) {
      pendingFocus.current = null;
      root.current?.querySelector<HTMLElement>(`[data-rd-nav-panel="${esc(openId)}"] a[href], [data-rd-nav-panel="${esc(openId)}"] [role="link"]`)?.focus();
    }
  }, [openId]);

  const tops = () => Array.from(root.current?.querySelectorAll<HTMLElement>("[data-rd-nav-top]") ?? []).filter((el) => !el.hasAttribute("data-disabled"));

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (event.key === "Escape" && openId) {
      const trigger = root.current?.querySelector<HTMLElement>(`[data-rd-nav-trigger="${esc(openId)}"]`);
      event.stopPropagation();
      close(false);
      trigger?.focus();
      return;
    }
    const list = tops();
    const index = list.indexOf(target);
    if (index === -1) return;
    const rtl = root.current ? getComputedStyle(root.current).direction === "rtl" : false;
    let next: HTMLElement | undefined;
    if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = list[(index + 1) % list.length];
    else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = list[(index - 1 + list.length) % list.length];
    else if (event.key === "Home") next = list[0];
    else if (event.key === "End") next = list[list.length - 1];
    else if (event.key === "ArrowDown" && target.hasAttribute("data-rd-nav-trigger")) {
      event.preventDefault();
      const id = target.getAttribute("data-rd-nav-trigger")!;
      if (openId === id) {
        root.current?.querySelector<HTMLElement>(`[data-rd-nav-panel="${esc(id)}"] a[href], [data-rd-nav-panel="${esc(id)}"] [role="link"]`)?.focus();
      } else {
        pendingFocus.current = id;
        open(id, false);
      }
      return;
    }
    if (!next) return;
    event.preventDefault();
    next.focus();
    const nextId = next.getAttribute("data-rd-nav-trigger");
    // With a panel open, moving to another trigger opens that one; moving to a plain link closes it.
    if (openId) {
      if (nextId) open(nextId, false);
      else close(false);
    }
  };

  const value = useMemo<RootContext>(() => ({ openId, open, close, toggle }), [openId, open, close, toggle]);

  return (
    <RootCtx.Provider value={value}>
      <nav
        ref={(node) => {
          root.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        aria-label={label}
        className={cx("relative w-fit max-w-full self-start text-[var(--rd-color-text-default)]", className)}
        onKeyDown={onKeyDown}
        onPointerDown={() => {
          pointerInside.current = true;
        }}
        onPointerUp={() => {
          pointerInside.current = false;
        }}
        onBlur={(event) => {
          // Focus leaving the navigation closes the panel. A click on blank panel space is not leaving.
          if (pointerInside.current) return;
          const to = event.relatedTarget as Node | null;
          if (!to || !event.currentTarget.contains(to)) close(false);
        }}
      >
        <AlignCtx.Provider value={align}>
          <ul className="flex items-center gap-1">{children}</ul>
        </AlignCtx.Provider>
      </nav>
    </RootCtx.Provider>
  );
});

export interface NavigationMenuItemProps {
  children: ReactNode;
  className?: string;
}

/** One entry in the bar: a NavigationMenuLink, or a NavigationMenuTrigger followed by its NavigationMenuContent. */
export const NavigationMenuItem = forwardRef<HTMLLIElement, NavigationMenuItemProps>(function NavigationMenuItem({ children, className }, ref) {
  const root = useRoot("NavigationMenuItem");
  const id = useId();
  const value = useMemo(() => ({ id, triggerId: `${id}-trigger`, contentId: `${id}-content` }), [id]);
  return (
    <ItemCtx.Provider value={value}>
      <li
        ref={ref}
        className={className}
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          const hasPanel = !!event.currentTarget.querySelector("[data-rd-nav-trigger]");
          if (hasPanel) root.open(id, root.openId === null);
          else if (root.openId) root.close(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "touch") return;
          root.close(true);
        }}
      >
        {children}
      </li>
    </ItemCtx.Provider>
  );
});

export interface NavigationMenuTriggerProps {
  children: ReactNode;
  /** A page inside this section is the current one. */
  isCurrent?: boolean;
  className?: string;
}

/** The button in the bar that opens a panel. It only opens the panel; it does not go to a page. */
export const NavigationMenuTrigger = forwardRef<HTMLButtonElement, NavigationMenuTriggerProps>(function NavigationMenuTrigger({ children, isCurrent, className }, ref) {
  const root = useRoot("NavigationMenuTrigger");
  const item = useContext(ItemCtx);
  if (!item) throw new Error("NavigationMenuTrigger must be used inside NavigationMenuItem.");
  const isOpen = root.openId === item.id;
  return (
    <AriaButton
      ref={ref}
      id={item.triggerId}
      data-rd-nav-top=""
      data-rd-nav-trigger={item.id}
      data-open={isOpen || undefined}
      aria-expanded={isOpen}
      aria-controls={item.contentId}
      onPress={(event) => root.toggle(item.id, event.pointerType)}
      className={cx("group pe-2", topBase, isCurrent && topCurrent, className)}
    >
      {children}
      {isCurrent && <span className="sr-only">, current section</span>}
      <ChevronDownIcon className="size-4 shrink-0 transition-transform duration-200 group-data-[open]:rotate-180 motion-reduce:transition-none" />
    </AriaButton>
  );
});

export interface NavigationMenuContentProps {
  children: ReactNode;
  className?: string;
}

/** The floating panel for the trigger before it. Put NavigationMenuLink elements, or a grid of them, inside. */
export const NavigationMenuContent = forwardRef<HTMLDivElement, NavigationMenuContentProps>(function NavigationMenuContent({ children, className }, ref) {
  const root = useRoot("NavigationMenuContent");
  const item = useContext(ItemCtx);
  if (!item) throw new Error("NavigationMenuContent must be used inside NavigationMenuItem.");
  const isOpen = root.openId === item.id;
  const align = useContext(AlignCtx);
  return (
    // The outer box starts right under the bar and carries a little padding, so the pointer can cross the gap without closing the panel.
    <div ref={ref} id={item.contentId} data-rd-nav-panel={item.id} hidden={!isOpen} className={cx("absolute top-full z-40 pt-2", panelAlign[align])}>
      <div
        className={cx(
          "w-max max-w-[calc(100vw-2rem)] rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] p-2 text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-floating)]",
          className,
        )}
      >
        <InPanelCtx.Provider value={true}>{children}</InPanelCtx.Provider>
      </div>
    </div>
  );
});

export interface NavigationMenuLinkProps {
  /** Where the link goes. */
  href?: string;
  /** The link text. In the bar it is the label; in a panel it is the heading of the link. */
  title?: ReactNode;
  /** A short line under the title. Only shown in a panel. */
  description?: ReactNode;
  /** Used as the title when no title is given. */
  children?: ReactNode;
  /** This link is the current page. */
  isCurrent?: boolean;
  /** A larger, emphasised link for the main destination of a panel. */
  isFeatured?: boolean;
  onPress?: () => void;
  className?: string;
}

/** A link: a plain item in the bar, or an entry with a title and a description inside a panel. */
export const NavigationMenuLink = forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(function NavigationMenuLink(
  { href, title, description, children, isCurrent, isFeatured, onPress, className },
  ref,
) {
  const root = useRoot("NavigationMenuLink");
  const inPanel = useContext(InPanelCtx);
  const titleId = useId();
  const descId = useId();
  const heading = title ?? children;
  const choose = () => {
    onPress?.();
    root.close(false);
  };

  if (!inPanel) {
    return (
      <AriaLink ref={ref} href={href} data-rd-nav-top="" aria-current={isCurrent ? "page" : undefined} onPress={choose} className={cx(topBase, isCurrent && topCurrent, className)}>
        {heading}
      </AriaLink>
    );
  }
  return (
    <AriaLink
      ref={ref}
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      aria-labelledby={description ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      onPress={choose}
      className={cx(
        "flex flex-col gap-1 rounded-[var(--rd-radius-control)] p-3 text-start transition-colors motion-reduce:transition-none",
        "data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
        isFeatured && "min-h-28 justify-end bg-[var(--rd-color-surface-subtle)]",
        isCurrent && "border-s-2 border-[var(--rd-color-text-default)]",
        focusRing,
        className,
      )}
    >
      <span id={titleId} className={cx("text-sm font-medium text-[var(--rd-color-text-default)]", isFeatured && "text-base")}>
        {heading}
        {isCurrent && <span className="sr-only">, current page</span>}
      </span>
      {description && (
        <span id={descId} className="text-sm leading-snug text-[var(--rd-color-text-muted)]">
          {description}
        </span>
      )}
    </AriaLink>
  );
});
