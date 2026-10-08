"use client";

import { forwardRef, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
  type DialogProps as AriaDialogProps,
} from "react-aria-components";
import { drawerDefaults, type DrawerSpecProps } from "../generated/drawer.types";
import { cx } from "../utils/cx";

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

interface PanelProps {
  title?: string;
  description?: string;
  isDismissable: boolean;
  setDrag: (dy: number) => void;
  setDragging: (on: boolean) => void;
  close: () => void;
  children: ReactNode;
}

function Panel({ title, description, isDismissable, setDrag, setDragging, close, children }: PanelProps) {
  const start = useRef<{ y: number; t: number; id: number; height: number } | null>(null);

  // A new open always starts at rest.
  useEffect(() => {
    setDrag(0);
    setDragging(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDismissable || (e.pointerType === "mouse" && e.button !== 0)) return;
    const panel = e.currentTarget.closest<HTMLElement>("[data-rd-drawer]");
    start.current = { y: e.clientY, t: e.timeStamp, id: e.pointerId, height: panel?.offsetHeight ?? 400 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || e.pointerId !== s.id) return;
    // Only downward movement counts; the panel never lifts above rest.
    setDrag(Math.max(0, e.clientY - s.y));
  };
  const finish = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const s = start.current;
    if (!s || e.pointerId !== s.id) return;
    start.current = null;
    setDragging(false);
    const dy = Math.max(0, e.clientY - s.y);
    const speed = dy / Math.max(1, e.timeStamp - s.t);
    if (!cancelled && (dy > Math.min(DISMISS_PX, Math.max(48, s.height * DISMISS_RATIO)) || (dy > 24 && speed > FLICK_PX_PER_MS))) {
      close();
    } else {
      setDrag(0);
    }
  };

  return (
    <>
      {/* The handle and header are the drag surface. Touch scrolling is off there so the browser does not take the gesture. */}
      <div
        className={cx("shrink-0 touch-none select-none", isDismissable && "cursor-grab active:cursor-grabbing")}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={(e) => finish(e, false)}
        onPointerCancel={(e) => finish(e, true)}
      >
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

export const Drawer = forwardRef<HTMLElement, DrawerProps>(function Drawer(
  {
    title,
    description,
    isDismissable = drawerDefaults.isDismissable,
    portalContainer,
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
        style={{ transform: drag ? `translateY(${drag}px)` : undefined }}
        className={cx(
          portalContainer ? "absolute" : "fixed",
          "inset-x-0 bottom-0 flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[var(--rd-radius-overlay)] border-t",
          "[box-shadow:var(--rd-elevation-overlay)] bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] border-[var(--rd-color-border-default)]",
          "data-[entering]:animate-[rd-drawer-up_200ms_ease-out] motion-reduce:!animate-none",
          dragging ? "transition-none" : "transition-transform duration-200 ease-out motion-reduce:transition-none",
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
            >
              {typeof children === "function" ? children(renderProps) : children}
            </Panel>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
});
