"use client";

import { forwardRef, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button as AriaButton } from "react-aria-components";
import { actionSheetDefaults, type ActionSheetSpecProps } from "../generated/action-sheet.types";
import { Drawer, type DrawerProps } from "../drawer/drawer";
import { Spinner } from "../spinner/spinner";
import { cx } from "../utils/cx";
import { resolvePermission, type PermissionValue } from "../utils/permissions";

/** One choice in the sheet. */
export interface ActionSheetAction {
  /** A stable id. */
  id: string;
  /** The text on the button. An icon never stands in for it. */
  label: string;
  /** A second line under the label. */
  description?: string;
  /** A 20-unit icon before the label. */
  icon?: ReactNode;
  /** "default", or "danger" for an action that destroys something: drawn in the danger color. */
  tone?: "default" | "danger";
  /** Runs when the action is chosen (after the confirmation, when there is one). Return a promise to keep the sheet open until it settles. */
  onAction: () => void | Promise<unknown>;
  /** Ask once more before running: the sheet shows the label, this description and a button to confirm. */
  confirm?: { description?: string; confirmLabel?: string };
  /** What the app allows: "allow" (default), "disabled" (shown, inactive, with the reason) or "hidden" (not drawn). The server must check again. */
  permission?: PermissionValue;
}

export interface ActionSheetProps
  extends ActionSheetSpecProps,
    Pick<DrawerProps, "isOpen" | "onOpenChange" | "aria-label" | "aria-labelledby" | "aria-describedby"> {
  className?: string;
}

/** The parts of the sheet that take a class name of their own. */
export type ActionSheetSlot = "list" | "action" | "cancel" | "confirm" | "error";
export type ActionSheetClassNames = Partial<Record<ActionSheetSlot, string>>;

const words = { cancel: "Cancel", back: "Back", error: "Something went wrong. Try again.", working: "Working" } as const;

const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";
const buttonBase = "flex w-full min-h-12 items-center gap-3 rounded-[var(--rd-radius-control)] px-4 py-2 text-start text-base";

interface BodyProps extends Pick<ActionSheetSpecProps, "actions" | "showCancel" | "onCancel" | "onError" | "labels" | "classNames"> {
  close: () => void;
}

function Body({ actions, showCancel = actionSheetDefaults.showCancel, onCancel, onError, labels, classNames, close }: BodyProps) {
  const text = { ...words, ...labels };
  const visible = actions.filter((a) => resolvePermission(a.permission).isVisible);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ActionSheetAction | null>(null);
  const [failed, setFailed] = useState(false);
  const list = useRef<HTMLUListElement | null>(null);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const returnTo = useRef<string | null>(null);
  const mounted = useRef(true);
  const headingId = useId();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Into the confirmation step the focus goes to its heading; back out it returns to the action that was chosen.
  useEffect(() => {
    if (confirming) heading.current?.focus();
    else if (returnTo.current) {
      list.current?.querySelector<HTMLElement>(`[data-action-id="${returnTo.current}"]`)?.focus();
      returnTo.current = null;
    }
  }, [confirming]);

  const run = async (action: ActionSheetAction) => {
    if (pendingId) return;
    setFailed(false);
    let result: void | Promise<unknown>;
    try {
      result = action.onAction();
    } catch (error) {
      setConfirming(null);
      setFailed(true);
      onError?.(error, action);
      return;
    }
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setPendingId(action.id);
      try {
        await result;
        close();
      } catch (error) {
        if (mounted.current) {
          setConfirming(null);
          setFailed(true);
        }
        onError?.(error, action);
      } finally {
        if (mounted.current) setPendingId(null);
      }
    } else {
      close();
    }
  };

  const choose = (action: ActionSheetAction) => {
    if (action.confirm) {
      returnTo.current = action.id;
      setFailed(false);
      setConfirming(action);
    } else void run(action);
  };

  // Arrow keys move through the actions, like the list of a menu.
  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-action-id]"));
    const at = buttons.indexOf(document.activeElement as HTMLElement);
    if (buttons.length === 0) return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : e.key === "ArrowDown" ? (at + 1) % buttons.length : (at - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
  };

  const status = (
    <p role="status" className="sr-only">
      {pendingId ? text.working : ""}
    </p>
  );

  if (confirming) {
    const danger = confirming.tone === "danger";
    const working = pendingId === confirming.id;
    return (
      <div
        role="group"
        aria-labelledby={headingId}
        aria-busy={working || undefined}
        onKeyDown={(e) => {
          // Escape steps back to the list; it does not close the whole sheet.
          if (e.key === "Escape" && !working) {
            e.stopPropagation();
            setConfirming(null);
          }
        }}
        className={cx("flex flex-col gap-3", classNames?.confirm)}
      >
        {status}
        <div className="flex flex-col gap-1 px-1">
          <h3 id={headingId} ref={heading} tabIndex={-1} className="text-base font-semibold outline-none">
            {confirming.label}
          </h3>
          {confirming.confirm?.description && <p className="text-sm text-[var(--rd-color-text-muted)]">{confirming.confirm.description}</p>}
        </div>
        <AriaButton
          aria-disabled={working || undefined}
          onPress={() => void run(confirming)}
          className={cx(
            buttonBase,
            "justify-center font-semibold",
            danger ? "bg-[var(--rd-color-action-danger)] text-[var(--rd-color-action-on-primary)]" : "bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)]",
            "data-[pressed]:brightness-95",
            focusRing,
          )}
        >
          {working && <Spinner decorative size="sm" className="text-current" />}
          {confirming.confirm?.confirmLabel ?? confirming.label}
        </AriaButton>
        <AriaButton
          isDisabled={working}
          onPress={() => setConfirming(null)}
          className={cx(buttonBase, "justify-center border border-[var(--rd-color-border-default)] font-medium data-[hovered]:bg-[var(--rd-color-surface-subtle)]", focusRing)}
        >
          {text.back}
        </AriaButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {status}
      <ul ref={list} aria-busy={pendingId !== null || undefined} onKeyDown={onListKeyDown} className={cx("flex flex-col", classNames?.list)}>
        {visible.map((action) => {
          const permission = resolvePermission(action.permission);
          const working = pendingId === action.id;
          const other = pendingId !== null && !working;
          const reasonId = `${headingId}-${action.id}`;
          const showReason = permission.isDisabled && permission.reason;
          return (
            <li key={action.id}>
              <AriaButton
                data-action-id={action.id}
                aria-disabled={permission.isDisabled || other || undefined}
                data-working={working || undefined}
                aria-describedby={showReason ? reasonId : undefined}
                onPress={() => {
                  if (permission.isAllowed && !pendingId) choose(action);
                }}
                className={cx(
                  buttonBase,
                  "data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
                  action.tone === "danger" ? "text-[var(--rd-color-feedback-danger)]" : "text-[var(--rd-color-text-default)]",
                  (permission.isDisabled || other) && "cursor-not-allowed opacity-50",
                  focusRing,
                  classNames?.action,
                )}
              >
                {working ? (
                  <Spinner decorative size="sm" className="text-current" />
                ) : (
                  action.icon && (
                    <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center [&_svg]:size-5">
                      {action.icon}
                    </span>
                  )
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{action.label}</span>
                  {action.description && <span className="text-sm font-normal text-[var(--rd-color-text-muted)]">{action.description}</span>}
                  {showReason && (
                    <span id={reasonId} className="text-sm font-normal text-[var(--rd-color-text-muted)]">
                      {permission.reason}
                    </span>
                  )}
                </span>
              </AriaButton>
            </li>
          );
        })}
      </ul>
      {failed && (
        <p role="alert" className={cx("px-4 text-sm text-[var(--rd-color-feedback-danger)]", classNames?.error)}>
          {text.error}
        </p>
      )}
      {showCancel && (
        <AriaButton
          onPress={() => {
            onCancel?.();
            close();
          }}
          className={cx(buttonBase, "justify-center border border-[var(--rd-color-border-default)] font-semibold data-[hovered]:bg-[var(--rd-color-surface-subtle)]", focusRing, classNames?.cancel)}
        >
          {text.cancel}
        </AriaButton>
      )}
    </div>
  );
}

/**
 * A short list of choices that slides up from the bottom of a phone screen for one item the person just
 * picked. It is a Drawer with the actions as data: touch-sized buttons, a separate Cancel, a confirmation
 * step for the ones that destroy something and actions that wait on a request. Open it with `DialogTrigger`.
 */
export const ActionSheet = forwardRef<HTMLElement, ActionSheetProps>(function ActionSheet(
  { title, description, actions, showCancel, onCancel, onError, labels, portalContainer, isDismissable = actionSheetDefaults.isDismissable, classNames, className, ...rest },
  ref,
) {
  return (
    <Drawer ref={ref} {...rest} title={title} description={description} portalContainer={portalContainer} isDismissable={isDismissable} className={className}>
      {({ close }) => <Body actions={actions} showCancel={showCancel} onCancel={onCancel} onError={onError} labels={labels} classNames={classNames} close={close} />}
    </Drawer>
  );
});
