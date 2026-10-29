"use client";

import { forwardRef, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
  type DialogProps as AriaDialogProps,
} from "react-aria-components";
import { drawerDefaults, type DrawerSpecProps } from "../generated/drawer.types";
import { cx } from "../utils/cx";
import { clampIndex, cleanSnapPoints, dragHeight, resolveSnap, snapHeights, stepIndex } from "./snap";

export interface DrawerProps
  extends DrawerSpecProps,
    Omit<AriaDialogProps, keyof DrawerSpecProps | "className" | "children"> {
  className?: string;
  /** Controlled open state, for drawers opened without a DialogTrigger. */
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const keyframes = `
@keyframes rd-drawer-up { from { transform: translateY(100%); } }
@keyframes rd-drawer-fade { from { opacity: 0; } }`;

/** A drag past this many pixels, or this share of the height, dismisses. */
const DISMISS_PX = 96;
const DISMISS_RATIO = 0.3;
const FLICK_PX_PER_MS = 0.6;

const words = { expand: "Expand", collapse: "Collapse", expanded: "Expanded", collapsed: "Collapsed" } as const;

/** What the panel needs to rest at several heights. Absent when the drawer has no snap points. */
interface SnapControl {
  heights: number[];
  index: number;
  /** The live height while the finger is down, or null at rest. */
  setLive: (height: number | null) => void;
  /** Settle on a snap point (a number) or close (null). */
  commit: (index: number | null) => void;
  labels: Record<keyof typeof words, string>;
  announcement: string;
  /** The height the sheet is showing now. */
  height: number;
}

interface PanelProps {
  title?: string;
  description?: string;
  isDismissable: boolean;
  setDrag: (dy: number) => void;
  setDragging: (on: boolean) => void;
  close: () => void;
  snap?: SnapControl;
  onOpened: () => void;
  children: ReactNode;
}

function Panel({ title, description, isDismissable, setDrag, setDragging, close, snap, onOpened, children }: PanelProps) {
  const start = useRef<{ y: number; t: number; id: number; height: number; base: number; last: number; lastT: number; speed: number } | null>(null);

  // A new open always starts at rest.
  useEffect(() => {
    setDrag(0);
    setDragging(false);
    snap?.setLive(null);
    onOpened();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDismissable || (e.pointerType === "mouse" && e.button !== 0)) return;
    const panel = e.currentTarget.closest<HTMLElement>("[data-rd-drawer]");
    const base = snap?.height ?? 0;
    start.current = { y: e.clientY, t: e.timeStamp, id: e.pointerId, height: panel?.offsetHeight ?? 400, base, last: base, lastT: e.timeStamp, speed: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || e.pointerId !== s.id) return;
    if (snap) {
      // Dragging up makes the sheet taller; the speed is kept for the flick.
      const next = dragHeight(s.base, s.y - e.clientY, snap.heights, isDismissable);
      s.speed = (next - s.last) / Math.max(1, e.timeStamp - s.lastT);
      s.last = next;
      s.lastT = e.timeStamp;
      snap.setLive(next);
      return;
    }
    // Only downward movement counts; the panel never lifts above rest.
    setDrag(Math.max(0, e.clientY - s.y));
  };
  const finish = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const s = start.current;
    if (!s || e.pointerId !== s.id) return;
    start.current = null;
    setDragging(false);
    if (snap) {
      snap.setLive(null);
      if (cancelled) return;
      snap.commit(resolveSnap({ height: s.last, velocity: s.speed, heights: snap.heights, dismissable: isDismissable }).index);
      return;
    }
    const dy = Math.max(0, e.clientY - s.y);
    const speed = dy / Math.max(1, e.timeStamp - s.t);
    if (!cancelled && (dy > Math.min(DISMISS_PX, Math.max(48, s.height * DISMISS_RATIO)) || (dy > 24 && speed > FLICK_PX_PER_MS))) {
      close();
    } else {
      setDrag(0);
    }
  };

  const top = snap ? snap.index === snap.heights.length - 1 : false;

  return (
    <>
      {/* The handle and header are the drag surface. Touch scrolling is off there so the browser does not take the gesture. */}
      <div
        className={cx("relative shrink-0 touch-none select-none", isDismissable && "cursor-grab active:cursor-grabbing")}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={(e) => finish(e, false)}
        onPointerCancel={(e) => finish(e, true)}
      >
        {snap && snap.heights.length > 1 && (
          // The keyboard and screen reader way to change the height; it shows when it has focus.
          <>
            <AriaButton
              onPointerDown={(e) => e.stopPropagation()}
              onPress={() => snap.commit(top ? 0 : stepIndex(snap.index, snap.heights.length, 1))}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                  snap.commit(stepIndex(snap.index, snap.heights.length, e.key === "ArrowUp" ? 1 : -1));
                }
              }}
              className={cx(
                "sr-only data-[focus-visible]:not-sr-only data-[focus-visible]:absolute data-[focus-visible]:end-3 data-[focus-visible]:top-2 data-[focus-visible]:z-10",
                "rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--rd-color-text-default)]",
                "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
              )}
            >
              {top ? snap.labels.collapse : snap.labels.expand}
            </AriaButton>
            <span role="status" className="sr-only">
              {snap.announcement}
            </span>
          </>
        )}
        <div aria-hidden="true" className="flex justify-center pb-2 pt-3">
          <span className="h-1.5 w-10 rounded-full bg-[var(--rd-color-border-strong)]" />
        </div>
        {(title || description) && (
          <div className="flex flex-col gap-1 px-6 pb-4">
            {title && (
              <Heading slot="title" className="text-lg font-semibold">
                {title}
              </Heading>
            )}
            {description && <p className="text-sm text-[var(--rd-color-text-muted)]">{description}</p>}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2 [overscroll-behavior:contain]" data-rd-drawer-body>
        {children}
      </div>
    </>
  );
}

/** The space a drawer may fill: the container it is drawn in, or the screen. */
function availableSpace(container: Element | null | undefined) {
  if (container) return container.clientHeight;
  return typeof window === "undefined" ? 0 : window.innerHeight;
}

export const Drawer = forwardRef<HTMLElement, DrawerProps>(function Drawer(
  {
    title,
    description,
    isDismissable = drawerDefaults.isDismissable,
    portalContainer,
    snapPoints,
    snap,
    defaultSnap = drawerDefaults.defaultSnap,
    onSnapChange,
    labels,
    isOpen,
    onOpenChange,
    children,
    className,
    ...rest
  },
  ref,
) {
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Resting at several heights: the points, the space they are shares of, and which one is showing.
  const points = cleanSnapPoints(snapPoints);
  const snapMode = points.length > 0;
  const [space, setSpace] = useState(() => availableSpace(portalContainer));
  useEffect(() => {
    if (!snapMode) return;
    const measure = () => setSpace(availableSpace(portalContainer));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapMode, portalContainer]);
  const heights = snapHeights(points, space);
  const [inner, setInner] = useState(defaultSnap);
  const controlled = snap !== undefined;
  const index = clampIndex(controlled ? snap : inner, points.length);
  const [live, setLive] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const text = { ...words, ...labels };

  const showing = live ?? heights[index] ?? 0;

  return (
    <ModalOverlay
      isDismissable={isDismissable}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      UNSTABLE_portalContainer={portalContainer ?? undefined}
      className={cx(portalContainer ? "absolute" : "fixed", "inset-0 z-50 bg-[var(--rd-color-overlay-backdrop)] backdrop-blur-[2px] data-[entering]:animate-[rd-drawer-fade_200ms] motion-reduce:animate-none")}
    >
      <style>{keyframes}</style>
      <Modal
        data-rd-drawer=""
        data-snap={snapMode ? index : undefined}
        style={snapMode ? { height: showing } : { transform: drag ? `translateY(${drag}px)` : undefined }}
        className={cx(
          portalContainer ? "absolute" : "fixed",
          "inset-x-0 bottom-0 flex w-full flex-col overflow-hidden rounded-t-[var(--rd-radius-overlay)] border-t",
          snapMode ? "max-h-full" : "max-h-[90dvh]",
          "[box-shadow:var(--rd-elevation-overlay)] bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] border-[var(--rd-color-border-default)]",
          "data-[entering]:animate-[rd-drawer-up_200ms_ease-out] motion-reduce:!animate-none",
          dragging ? "transition-none" : "transition-[height,transform] duration-200 ease-out motion-reduce:transition-none",
        )}
      >
        <AriaDialog {...rest} ref={ref} className={cx("flex min-h-0 flex-1 flex-col outline-none", className)}>
          {(renderProps) => (
            <Panel
              title={title}
              description={description}
              isDismissable={isDismissable}
              setDrag={setDrag}
              setDragging={setDragging}
              close={renderProps.close}
              onOpened={() => {
                if (!controlled) setInner(defaultSnap);
                setAnnouncement("");
              }}
              snap={
                snapMode
                  ? {
                      heights,
                      index,
                      height: showing,
                      setLive,
                      labels: text,
                      announcement,
                      commit: (next) => {
                        if (next === null) {
                          renderProps.close();
                          return;
                        }
                        if (next !== index) {
                          if (!controlled) setInner(next);
                          onSnapChange?.(next);
                          setAnnouncement(next > index ? text.expanded : text.collapsed);
                        }
                      },
                    }
                  : undefined
              }
            >
              {typeof children === "function" ? children(renderProps) : children}
            </Panel>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
});
