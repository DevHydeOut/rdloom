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
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Link, Popover, type LinkProps } from "react-aria-components";
import { hoverCardDefaults, type HoverCardSpecProps } from "../generated/hover-card.types";
import { cx } from "../utils/cx";

interface HoverCardContextValue {
  triggerRef: RefObject<HTMLAnchorElement | null>;
  cardRef: RefObject<HTMLDivElement | null>;
  contentId: string;
  isOpen: boolean;
  placement: NonNullable<HoverCardSpecProps["placement"]>;
  requestOpen(): void;
  requestClose(): void;
  cancel(): void;
  closeNow(): void;
}

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function useHoverCard(part: string): HoverCardContextValue {
  const ctx = useContext(HoverCardContext);
  if (!ctx) throw new Error(`${part} must be used inside a HoverCard`);
  return ctx;
}

const TABBABLE = 'a[href], button, input, select, textarea, [tabindex]';
const tabbablesIn = (el: HTMLElement | null) => (el ? Array.from(el.querySelectorAll<HTMLElement>(TABBABLE)).filter((n) => n.tabIndex >= 0 && !(n as HTMLButtonElement).disabled) : []);

export interface HoverCardProps extends HoverCardSpecProps {}

/**
 * A preview that opens when its trigger is hovered with a mouse or reached with the keyboard,
 * after a short delay. It never opens on touch: a tap just follows the link. Put only
 * information in it that is available somewhere else too.
 */
export function HoverCard({
  children,
  openDelay = hoverCardDefaults.openDelay,
  closeDelay = hoverCardDefaults.closeDelay,
  placement = hoverCardDefaults.placement,
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
}: HoverCardProps) {
  const [inner, setInner] = useState(defaultOpen);
  const controlled = isOpenProp !== undefined;
  const isOpen = controlled ? isOpenProp : inner;

  const latest = useRef({ isOpen, onOpenChange, controlled });
  latest.current = { isOpen, onOpenChange, controlled };
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const triggerRef = useRef<HTMLAnchorElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const contentId = useId();

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const set = useCallback((next: boolean) => {
    const { isOpen: current, onOpenChange: notify, controlled: isControlled } = latest.current;
    if (next === current) return;
    if (!isControlled) setInner(next);
    notify?.(next);
  }, []);

  const request = useCallback(
    (next: boolean, delay: number) => {
      cancel();
      if (next === latest.current.isOpen) return;
      if (delay <= 0) set(next);
      else timer.current = setTimeout(() => set(next), delay);
    },
    [cancel, set],
  );

  useEffect(() => cancel, [cancel]);

  const value = useMemo<HoverCardContextValue>(
    () => ({
      triggerRef,
      cardRef,
      contentId,
      isOpen,
      placement,
      requestOpen: () => request(true, openDelay),
      requestClose: () => request(false, closeDelay),
      cancel,
      closeNow: () => request(false, 0),
    }),
    [contentId, isOpen, placement, request, openDelay, closeDelay, cancel],
  );

  return <HoverCardContext.Provider value={value}>{children}</HoverCardContext.Provider>;
}

export interface HoverCardTriggerProps extends Omit<LinkProps, "className" | "children"> {
  className?: string;
  children: ReactNode;
}

/** Opens the card when the trigger gets keyboard focus (not when a mouse click or a tap focuses it). */
function FocusOpen({ active, onActive }: { active: boolean; onActive(): void }) {
  useEffect(() => {
    if (active) onActive();
    // Only when focus-visible turns on; later renders must not reopen a card that was closed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return null;
}

/** The link the card belongs to. Hovering it or reaching it with the keyboard opens the card. */
export const HoverCardTrigger = forwardRef<HTMLAnchorElement, HoverCardTriggerProps>(function HoverCardTrigger(
  { className, children, onHoverStart, onHoverEnd, onBlur, onKeyDown, ...rest },
  ref,
) {
  const ctx = useHoverCard("HoverCardTrigger");
  const setRefs = (node: HTMLAnchorElement | null) => {
    ctx.triggerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  return (
    <Link
      {...rest}
      ref={setRefs}
      aria-describedby={ctx.isOpen ? ctx.contentId : rest["aria-describedby"]}
      onHoverStart={(e) => {
        onHoverStart?.(e);
        ctx.requestOpen();
      }}
      onHoverEnd={(e) => {
        onHoverEnd?.(e);
        ctx.requestClose();
      }}
      onBlur={(e) => {
        onBlur?.(e);
        if (!ctx.cardRef.current?.contains(e.relatedTarget as Node | null)) ctx.requestClose();
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === "Escape" && ctx.isOpen) {
          ctx.closeNow();
        } else if (e.key === "Tab" && !e.shiftKey && ctx.isOpen) {
          const first = tabbablesIn(ctx.cardRef.current)[0];
          if (first) {
            e.preventDefault();
            ctx.cancel();
            first.focus();
          }
        }
      }}
      className={cx(
        "cursor-pointer rounded-sm font-medium text-[var(--rd-color-text-default)] underline decoration-[var(--rd-color-border-strong)] decoration-1 underline-offset-4 outline-none transition-colors " +
          "data-[hovered]:decoration-[var(--rd-color-text-default)] " +
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[focus-visible]:ring-offset-2",
        className,
      )}
    >
      {({ isFocusVisible }) => (
        <>
          {children}
          <FocusOpen active={isFocusVisible} onActive={ctx.requestOpen} />
        </>
      )}
    </Link>
  );
});

export interface HoverCardContentProps {
  /** Names the card for screen readers, e.g. "Ada Lovelace, profile preview". */
  label: string;
  children: ReactNode;
  className?: string;
}

const card =
  "[box-shadow:var(--rd-elevation-floating)] bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] " +
  "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-overlay)]";

/** The card. It holds a preview only; it is not the one place to find this information. */
export function HoverCardContent({ label, children, className }: HoverCardContentProps) {
  const ctx = useHoverCard("HoverCardContent");

  const toTrigger = () => {
    ctx.cancel();
    ctx.triggerRef.current?.focus();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      toTrigger();
      ctx.closeNow();
    }
  };

  // Shift+Tab before the first control goes back to the trigger. React Aria's own handling of a
  // popover would skip past the trigger, so this runs first (window, capture phase). Tab past the
  // last control is left alone: focus continues to the next element after the trigger.
  const { isOpen, cardRef } = ctx;
  useEffect(() => {
    if (!isOpen) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !e.shiftKey || !cardRef.current?.contains(e.target as Node)) return;
      if (e.target !== tabbablesIn(cardRef.current)[0]) return;
      e.preventDefault();
      e.stopPropagation();
      toTrigger();
    };
    window.addEventListener("keydown", onTab, true);
    return () => window.removeEventListener("keydown", onTab, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Popover
      triggerRef={ctx.triggerRef}
      isOpen={ctx.isOpen}
      onOpenChange={(open) => {
        // Focus leaving the card for the trigger asks to close; the trigger regaining focus cancels it.
        if (!open) ctx.requestClose();
      }}
      isNonModal
      placement={ctx.placement}
      offset={8}
      className={cx(card, className)}
    >
      <div
        ref={ctx.cardRef}
        id={ctx.contentId}
        role="group"
        aria-label={label}
        className="w-72 max-w-[calc(100vw-1.5rem)] p-4 text-sm outline-none"
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") ctx.cancel();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "touch") ctx.requestClose();
        }}
        onFocus={ctx.cancel}
        onBlur={(e) => {
          const next = e.relatedTarget as Node | null;
          if (!ctx.cardRef.current?.contains(next) && next !== ctx.triggerRef.current) ctx.requestClose();
        }}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </Popover>
  );
}
