"use client";

import { forwardRef, useEffect, useId, useRef, useState, useSyncExternalStore, version, type CSSProperties, type KeyboardEvent } from "react";
import { Button as AriaButton } from "react-aria-components";
import { orientationGuardDefaults, type OrientationGuardSpecProps } from "../generated/orientation-guard.types";
import { cx } from "../utils/cx";
import { PhoneIcon, PhoneLandscapeIcon } from "../utils/icons";

export interface OrientationGuardProps extends OrientationGuardSpecProps {
  className?: string;
}

/** The parts of the guard that take a class name of their own. */
export type OrientationGuardSlot = "root" | "content" | "overlay" | "icon" | "title" | "message" | "button";
export type OrientationGuardClassNames = Partial<Record<OrientationGuardSlot, string>>;

type Orientation = "portrait" | "landscape";

// React 19 takes inert as a boolean, React 18 only as an attribute string.
const inertProps = (Number(version.split(".")[0]) >= 19 ? { inert: true } : { inert: "" }) as Record<string, unknown>;

const keyframes = `
@keyframes rd-orientation-turn { 0%, 20% { transform: rotate(var(--rd-turn-from)); } 65%, 100% { transform: rotate(0deg); } }`;

const words = {
  title: "Rotate your device",
  dismiss: "Continue anyway",
} as const;
const messages: Record<Orientation, string> = {
  portrait: "This works best upright. Turn your phone so it is upright.",
  landscape: "This works best sideways. Turn your phone sideways.",
};

const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

/** How the device is held. The screen's own orientation is used when there is one, because a keyboard shrinking the page must not read as a turn. */
function readOrientation(): Orientation {
  const type = typeof screen !== "undefined" ? screen.orientation?.type : undefined;
  if (type) return type.startsWith("landscape") ? "landscape" : "portrait";
  if (typeof window.matchMedia === "function") {
    const query = window.matchMedia("(orientation: landscape)");
    // A mock or an old browser may not answer; then the page's own size decides.
    if (typeof query?.matches === "boolean" && (query.matches || window.matchMedia("(orientation: portrait)")?.matches)) return query.matches ? "landscape" : "portrait";
  }
  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

const isTouchScreen = () => typeof window.matchMedia === "function" && !!window.matchMedia("(pointer: coarse)")?.matches;

/** True when the guard should cover the content right now. */
function readBlocked(require: Orientation, appliesBelow: number, current: Orientation | undefined): boolean {
  if (typeof window === "undefined") return false;
  // Told how the phone is held: believe it, and skip the device checks.
  if (current) return current !== require;
  if (!isTouchScreen()) return false;
  if (Math.min(window.innerWidth, window.innerHeight) >= appliesBelow) return false;
  return readOrientation() !== require;
}

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  const orientation = typeof screen !== "undefined" ? screen.orientation : undefined;
  orientation?.addEventListener?.("change", onChange);
  const query = typeof window.matchMedia === "function" ? window.matchMedia("(orientation: landscape)") : null;
  query?.addEventListener?.("change", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
    orientation?.removeEventListener?.("change", onChange);
    query?.removeEventListener?.("change", onChange);
  };
}

/**
 * Asks a phone to be turned the way a screen needs. A web page cannot lock the screen, so this covers
 * the content with a message until the phone is turned, and lets people continue anyway unless you turn
 * that off. The content stays in the page and keeps its state. Only for screens where one orientation is
 * truly essential.
 */
export const OrientationGuard = forwardRef<HTMLDivElement, OrientationGuardProps>(function OrientationGuard(
  {
    children,
    require = orientationGuardDefaults.require,
    dismissible = orientationGuardDefaults.dismissible,
    appliesBelow = orientationGuardDefaults.appliesBelow,
    scope = orientationGuardDefaults.scope,
    current,
    tryLock = orientationGuardDefaults.tryLock,
    isDisabled = orientationGuardDefaults.isDisabled,
    labels,
    onDismiss,
    onBlockedChange,
    classNames,
    className,
  },
  ref,
) {
  const text = { ...words, message: messages[require], ...labels };
  const titleId = useId();
  const messageId = useId();
  const [dismissed, setDismissed] = useState(false);
  // The server and the first render show the content; the message can only appear once the orientation is known.
  const wrong = useSyncExternalStore(
    subscribe,
    () => readBlocked(require, appliesBelow, current),
    () => false,
  );
  const blocked = wrong && !dismissed && !isDisabled;

  // Tell the app, so the content can pause while it cannot be used.
  const lastReported = useRef(false);
  const latestCallback = useRef(onBlockedChange);
  latestCallback.current = onBlockedChange;
  useEffect(() => {
    if (lastReported.current === blocked) return;
    lastReported.current = blocked;
    latestCallback.current?.(blocked);
  }, [blocked]);

  // The message takes focus when it appears and gives it back when it goes away. A guard that covers the whole
  // screen always takes it; a box inside a page only when focus was inside the content that just became unreachable
  // (it would be lost otherwise), so a page that opens already blocked is not pulled to the message on load.
  const overlay = useRef<HTMLDivElement | null>(null);
  const contentBox = useRef<HTMLDivElement | null>(null);
  const before = useRef<HTMLElement | null>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (blocked) {
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const lostFocus = !!active && !!contentBox.current?.contains(active);
      if (scope === "screen" || lostFocus) {
        before.current = active;
        moved.current = true;
        overlay.current?.focus({ preventScroll: true });
      }
    } else if (moved.current) {
      moved.current = false;
      if (before.current?.isConnected) before.current.focus({ preventScroll: true });
      before.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked]);

  // An extra: browsers that allow it lock the screen to the orientation the content needs.
  useEffect(() => {
    // The DOM typings leave lock and unlock out, because few browsers have them.
    const orientation = typeof screen !== "undefined" ? (screen.orientation as (ScreenOrientation & { lock?: (to: Orientation) => Promise<void>; unlock?: () => void }) | undefined) : undefined;
    if (!tryLock || isDisabled || !orientation?.lock) return;
    orientation.lock(require).catch(() => {});
    return () => {
      try {
        orientation.unlock?.();
      } catch {
        // Nothing was locked.
      }
    };
  }, [tryLock, isDisabled, require]);

  const dismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && dismissible) {
      e.stopPropagation();
      dismiss();
    }
  };

  return (
    <div ref={ref} data-blocked={blocked || undefined} data-require={require} className={cx("relative", className, classNames?.root)}>
      <style>{keyframes}</style>
      <div ref={contentBox} {...(blocked ? inertProps : {})} aria-hidden={blocked || undefined} className={classNames?.content}>
        {children}
      </div>
      {blocked && (
        <div
          ref={overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={messageId}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className={cx(
            scope === "screen" ? "fixed" : "absolute",
            "inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[var(--rd-color-surface-default)] p-8 text-center text-[var(--rd-color-text-default)] outline-none",
            classNames?.overlay,
          )}
        >
          <span
            aria-hidden="true"
            style={{ "--rd-turn-from": require === "portrait" ? "-90deg" : "90deg" } as CSSProperties}
            className={cx("text-[var(--rd-color-text-muted)] motion-safe:animate-[rd-orientation-turn_2.6s_ease-in-out_infinite]", classNames?.icon)}
          >
            {require === "portrait" ? <PhoneIcon className="size-16" strokeWidth={1} /> : <PhoneLandscapeIcon className="size-16" strokeWidth={1} />}
          </span>
          <h2 id={titleId} className={cx("text-xl font-semibold", classNames?.title)}>
            {text.title}
          </h2>
          <p id={messageId} className={cx("max-w-xs text-sm text-[var(--rd-color-text-muted)]", classNames?.message)}>
            {text.message}
          </p>
          {dismissible && (
            <AriaButton
              onPress={dismiss}
              className={cx(
                "min-h-11 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] px-5 text-sm font-medium data-[hovered]:bg-[var(--rd-color-surface-raised)]",
                focusRing,
                classNames?.button,
              )}
            >
              {text.dismiss}
            </AriaButton>
          )}
        </div>
      )}
    </div>
  );
});
