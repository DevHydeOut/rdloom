"use client";

import { forwardRef, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Button as AriaButton } from "react-aria-components";
import { swipeableRowDefaults, type SwipeableRowSpecProps } from "../generated/swipeable-row.types";
import { cx } from "../utils/cx";
import { resolvePermission, type PermissionValue } from "../utils/permissions";
import { ACTION_WIDTH, AXIS_LOCK_PX, dragPosition, resolveRelease, restingPosition, widthOf, type SwipeSide, type Widths } from "./gesture";

/** One action behind a row. */
export interface SwipeAction {
  /** A stable id. */
  id: string;
  /** The text on the button. An icon never stands in for it. */
  label: string;
  /** A 20-unit icon above the label. */
  icon?: ReactNode;
  /** The look: "default" is a quiet surface, "primary" the brand color, "danger" the destructive color. */
  tone?: "default" | "primary" | "danger";
  /** Runs when the action is chosen by swipe, button or keyboard. */
  onAction: () => void;
  /** What the app allows: "allow" (default), "disabled" (shown, inactive, with the reason read out) or "hidden" (not drawn). The server must check again. */
  permission?: PermissionValue;
}

export interface SwipeableRowProps extends SwipeableRowSpecProps {
  className?: string;
}

/** The parts of the row that take a class name of their own. */
export type SwipeableRowSlot = "root" | "content" | "actions" | "action" | "toggle";
export type SwipeableRowClassNames = Partial<Record<SwipeableRowSlot, string>>;

const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

const tones = {
  default: "bg-[var(--rd-color-surface-subtle)] text-[var(--rd-color-text-default)]",
  primary: "bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)]",
  danger: "bg-[var(--rd-color-action-danger)] text-[var(--rd-color-action-on-primary)]",
} as const;

const visibleActions = (actions: SwipeAction[] | undefined) => (actions ?? []).filter((a) => resolvePermission(a.permission).isVisible);

interface ActionsProps {
  side: SwipeSide;
  actions: SwipeAction[];
  shown: boolean;
  /** How far the row has moved, so the first action can stretch to fill a long swipe. */
  extent: number;
  label: string;
  onRun: (action: SwipeAction) => void;
  classNames?: SwipeableRowClassNames;
}

function Actions({ side, actions, shown, extent, label, onRun, classNames }: ActionsProps) {
  const ids = useId();
  if (actions.length === 0) return null;
  const style: CSSProperties = {
    width: Math.max(widthOf(actions.length), extent),
    // Out of the tab order and the accessibility tree while closed; the hide waits for the slide to finish.
    visibility: shown ? "visible" : "hidden",
    transition: shown ? undefined : "visibility 0s linear 200ms",
  };
  return (
    <div
      role="group"
      aria-label={label}
      data-side={side}
      style={style}
      className={cx("absolute inset-y-0 flex", side === "start" ? "start-0" : "end-0", classNames?.actions)}
    >
      {actions.map((action, index) => {
        const permission = resolvePermission(action.permission);
        const reasonId = `${ids}-${action.id}`;
        return (
          <span key={action.id} className={cx("flex", index === 0 ? "flex-1" : "shrink-0")} style={{ minWidth: ACTION_WIDTH }}>
            <AriaButton
              aria-disabled={permission.isDisabled || undefined}
              aria-describedby={permission.isDisabled && permission.reason ? reasonId : undefined}
              onPress={() => {
                if (permission.isAllowed) onRun(action);
              }}
              className={cx(
                "flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-xs font-medium",
                tones[action.tone ?? "default"],
                "data-[pressed]:brightness-95",
                permission.isDisabled && "cursor-not-allowed opacity-50",
                focusRing,
                classNames?.action,
              )}
            >
              {action.icon && (
                <span aria-hidden="true" className="flex size-5 items-center justify-center [&_svg]:size-5">
                  {action.icon}
                </span>
              )}
              <span className="max-w-full truncate">{action.label}</span>
            </AriaButton>
            {permission.isDisabled && permission.reason && (
              <span id={reasonId} className="sr-only">
                {permission.reason}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/**
 * A list row that slides sideways to show actions behind it. The swipe is a shortcut: a button shows the
 * same actions for the keyboard and screen readers. Over the row, vertical movement still scrolls the
 * page; only a horizontal move starts the swipe.
 */
export const SwipeableRow = forwardRef<HTMLDivElement, SwipeableRowProps>(function SwipeableRow(
  {
    children,
    startActions,
    endActions,
    actionsLabel = swipeableRowDefaults.actionsLabel,
    open,
    defaultOpen = null,
    onOpenChange,
    fullSwipe = swipeableRowDefaults.fullSwipe,
    closeOnAction = swipeableRowDefaults.closeOnAction,
    isDisabled = swipeableRowDefaults.isDisabled,
    classNames,
    className,
  },
  forwardedRef,
) {
  const start = visibleActions(startActions);
  const end = visibleActions(endActions);
  const widths: Widths = { start: widthOf(start.length), end: widthOf(end.length) };

  const root = useRef<HTMLDivElement | null>(null);
  const toggle = useRef<HTMLButtonElement | null>(null);

  const controlled = open !== undefined;
  const [inner, setInner] = useState<SwipeSide | null>(defaultOpen);
  // A side with no actions cannot be open.
  const wanted = controlled ? open : inner;
  const side: SwipeSide | null = wanted === "start" && widths.start > 0 ? "start" : wanted === "end" && widths.end > 0 ? "end" : null;

  const setSide = (next: SwipeSide | null) => {
    if (next === side) return;
    if (!controlled) setInner(next);
    onOpenChange?.(next);
  };

  // While the finger is down: the live position, and the swipe's bookkeeping.
  const [position, setPosition] = useState<number | null>(null);
  const gesture = useRef<{ id: number; x: number; y: number; t: number; locked: boolean; last: number; lastT: number; speed: number; rest: number } | null>(null);
  const swiped = useRef(false);
  const focusFirst = useRef(false);

  // Right to left pages swap the sides with the text.
  const sign = () => (root.current && getComputedStyle(root.current).direction === "rtl" ? -1 : 1);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDisabled || (widths.start === 0 && widths.end === 0)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const rest = restingPosition(side, widths);
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, locked: false, last: rest, lastT: e.timeStamp, speed: 0, rest };
    swiped.current = false;
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || e.pointerId !== g.id) return;
    const dx = (e.clientX - g.x) * sign();
    const dy = e.clientY - g.y;
    if (!g.locked) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      // A mostly vertical move belongs to the page's scrolling.
      if (Math.abs(dy) > Math.abs(dx)) {
        gesture.current = null;
        return;
      }
      g.locked = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    const next = dragPosition(g.rest, dx, widths, fullSwipe ? root.current?.offsetWidth || 0 : 0);
    const dt = Math.max(1, e.timeStamp - g.lastT);
    g.speed = (next - g.last) / dt;
    g.last = next;
    g.lastT = e.timeStamp;
    swiped.current = true;
    setPosition(next);
  };

  const onUp = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || e.pointerId !== g.id) return;
    gesture.current = null;
    if (!g.locked) return;
    setPosition(null);
    if (cancelled) return;
    const release = resolveRelease({ position: g.last, velocity: g.speed, widths, rowWidth: root.current?.offsetWidth ?? 0, fullSwipe });
    if (release.full) {
      const action = (release.side === "start" ? start : end).find((a) => resolvePermission(a.permission).isAllowed);
      if (action) {
        action.onAction();
        setSide(null);
        return;
      }
    }
    setSide(release.side);
  };

  const run = (action: SwipeAction) => {
    action.onAction();
    if (closeOnAction) {
      setSide(null);
      if (root.current?.contains(document.activeElement)) toggle.current?.focus();
    }
  };

  // Opened from the button: move to the first action so the keyboard can carry on.
  useEffect(() => {
    if (side && focusFirst.current) root.current?.querySelector<HTMLElement>(`[data-side="${side}"] button`)?.focus();
    focusFirst.current = false;
  }, [side]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && side) {
      e.stopPropagation();
      setSide(null);
      toggle.current?.focus();
    }
  };

  // A tap outside closes an open row.
  useEffect(() => {
    if (!side) return;
    const outside = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setSide(null);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  const rest = restingPosition(side, widths);
  const logical = position ?? rest;
  const dragging = position !== null;
  const shown = side !== null || dragging;
  const hasActions = widths.start > 0 || widths.end > 0;

  return (
    <div
      ref={(node) => {
        root.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      data-open={side ?? undefined}
      data-dragging={dragging || undefined}
      onKeyDown={onKeyDown}
      className={cx("relative isolate overflow-hidden", className, classNames?.root)}
    >
      {start.length > 0 && <Actions side="start" actions={start} shown={shown} extent={logical > 0 ? logical : 0} label={actionsLabel} onRun={run} classNames={classNames} />}
      {end.length > 0 && <Actions side="end" actions={end} shown={shown} extent={logical < 0 ? -logical : 0} label={actionsLabel} onRun={run} classNames={classNames} />}
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={(e) => onUp(e, false)}
        onPointerCancel={(e) => onUp(e, true)}
        // After a swipe the click that follows must not reach what was under the finger, and a tap on an open row closes it.
        onClickCapture={(e) => {
          if (swiped.current || side) {
            e.preventDefault();
            e.stopPropagation();
            if (side && !swiped.current) setSide(null);
            swiped.current = false;
          }
        }}
        style={{ transform: logical === 0 ? undefined : `translateX(${logical * sign()}px)` }}
        className={cx(
          "relative bg-[var(--rd-color-surface-default)]",
          // Vertical panning stays with the page; horizontal moves come to the row.
          hasActions && !isDisabled && "touch-pan-y",
          dragging ? "select-none" : "transition-transform duration-200 ease-out motion-reduce:transition-none",
          classNames?.content,
        )}
      >
        {children}
      </div>
      {hasActions && (
        // Reached by keyboard and screen reader, shown when it has focus.
        <AriaButton
          ref={toggle}
          aria-expanded={side !== null}
          onPress={() => {
            if (side) setSide(null);
            else {
              focusFirst.current = true;
              setSide(widths.end > 0 ? "end" : "start");
            }
          }}
          className={cx(
            "sr-only data-[focus-visible]:not-sr-only data-[focus-visible]:absolute data-[focus-visible]:end-2 data-[focus-visible]:top-1/2 data-[focus-visible]:z-10 data-[focus-visible]:-translate-y-1/2",
            "rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-3 py-2 text-xs font-medium text-[var(--rd-color-text-default)]",
            focusRing,
            classNames?.toggle,
          )}
        >
          {actionsLabel}
        </AriaButton>
      )}
    </div>
  );
});
