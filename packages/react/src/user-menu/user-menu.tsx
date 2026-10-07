"use client";

import { Fragment, forwardRef, useId, useState, type ReactNode } from "react";
import { Button as AriaButton, Menu as AriaMenu, MenuTrigger, Popover, Separator } from "react-aria-components";
import { userMenuDefaults, type UserMenuSpecProps } from "../generated/user-menu.types";
import { useAction } from "../action-button/use-action";
import { AlertDialog } from "../alert-dialog/alert-dialog";
import { Avatar } from "../avatar/avatar";
import { MenuItem, MenuSection } from "../menu/menu";
import { cx } from "../utils/cx";
import { ChevronsUpDownIcon, Spinner } from "../utils/icons";
import { resolvePermission, type PermissionValue } from "../utils/permissions";

/** One entry of the menu. */
export interface UserMenuItem {
  /** A stable id. */
  id: string;
  label: string;
  /** A 16-unit icon, drawn before the label. */
  icon?: ReactNode;
  /** Where it goes. Without one the entry is a button and `onSelect` does the work. */
  href?: string;
  onSelect?: () => void;
  /** "allow" (default), "disabled" (shown dimmed, with the reason beside it) or "hidden". The server must check again. */
  permission?: PermissionValue;
  /** "danger" draws a destructive entry in the danger color. */
  variant?: "default" | "danger";
}

/** Entries that belong together, with an optional heading. */
export interface UserMenuGroup {
  label?: string;
  items: UserMenuItem[];
}

export interface UserMenuProps extends UserMenuSpecProps {
  className?: string;
}

/** The parts of the user menu that take a class name of their own. */
export type UserMenuSlot = "root" | "trigger" | "avatar" | "name" | "popover" | "header" | "list" | "item" | "separator" | "theme" | "status";
export type UserMenuClassNames = Partial<Record<UserMenuSlot, string>>;

const panel =
  "[box-shadow:var(--rd-elevation-floating)] bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-overlay)]";
const focusRing = "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

/**
 * The avatar button of an app that opens the account menu: who is signed in, your own entries in groups,
 * a row for the theme, and a Sign out entry that can ask first, shows that it is working, and announces
 * the result from a status region that stays on the page after the menu closes. It signs nobody out
 * itself: `onSignOut` is your call.
 */
export const UserMenu = forwardRef<HTMLDivElement, UserMenuProps>(function UserMenu(
  {
    user,
    items,
    groups,
    themeRow,
    onSignOut,
    confirm,
    signOutLabel = userMenuDefaults.signOutLabel,
    signingOutLabel = userMenuDefaults.signingOutLabel,
    signedOutMessage = userMenuDefaults.signedOutMessage,
    errorMessage = userMenuDefaults.errorMessage,
    onSignedOut,
    onError,
    permissions,
    size = userMenuDefaults.size,
    align = userMenuDefaults.align,
    showName = userMenuDefaults.showName,
    label = userMenuDefaults.label,
    classNames,
    className,
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nameId = useId();
  const { state, run, isPending } = useAction(
    async () => {
      return await onSignOut?.();
    },
    {
      onSuccess: (result) => {
        setOpen(false);
        onSignedOut?.(result);
      },
      onError: (error) => {
        // Close the menu: while it is open the rest of the page, the status region included, is hidden from screen readers.
        setOpen(false);
        onError?.(error);
      },
    },
  );

  const signOut = resolvePermission(permissions?.signOut);
  const showSignOut = !!onSignOut && signOut.isVisible;

  // Entries as the person may see them: hidden ones are gone, and a group left with nothing is dropped.
  const sections: UserMenuGroup[] = [];
  const base: UserMenuGroup[] = [...(items?.length ? [{ items }] : []), ...(groups ?? [])];
  for (const group of base) {
    const visible = group.items.filter((item) => resolvePermission(item.permission).isVisible);
    if (visible.length) sections.push({ ...group, items: visible });
  }

  const entry = (item: UserMenuItem) => {
    const access = resolvePermission(item.permission);
    return (
      <MenuItem
        key={item.id}
        id={item.id}
        textValue={item.label}
        href={access.isAllowed ? item.href : undefined}
        isDisabled={access.isDisabled}
        variant={item.variant}
        onAction={access.isAllowed ? item.onSelect : undefined}
        className={classNames?.item}
      >
        <span className="flex items-center gap-2">
          {item.icon && (
            <span aria-hidden="true" className="inline-flex shrink-0 text-[var(--rd-color-text-muted)]">
              {item.icon}
            </span>
          )}
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{item.label}</span>
            {access.isDisabled && access.reason && <span className="truncate text-xs text-[var(--rd-color-text-muted)]">{access.reason}</span>}
          </span>
        </span>
      </MenuItem>
    );
  };

  const separator = (key: string) => <Separator key={key} className={cx("my-1.5 border-t border-[var(--rd-color-border-default)]", classNames?.separator)} />;

  const message = state === "success" ? signedOutMessage : state === "error" ? errorMessage : "";
  const avatarSize = size === "md" ? "md" : "sm";

  return (
    <div ref={ref} className={cx("relative inline-flex", className, classNames?.root)}>
      <MenuTrigger isOpen={open} onOpenChange={setOpen}>
        <AriaButton
          aria-label={`${label}, ${user.name}`}
          className={cx(
            "inline-flex items-center gap-2.5 text-start data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
            focusRing,
            showName ? "rounded-[var(--rd-radius-control)] p-1.5" : "rounded-full",
            classNames?.trigger,
          )}
        >
          <Avatar name={user.name} src={user.avatarUrl} size={avatarSize} decorative className={classNames?.avatar} />
          {showName && (
            <span className={cx("flex min-w-0 flex-col leading-tight", classNames?.name)}>
              <span className="truncate text-sm font-medium text-[var(--rd-color-text-default)]">{user.name}</span>
              {user.email && <span className="truncate text-xs text-[var(--rd-color-text-muted)]">{user.email}</span>}
            </span>
          )}
          {showName && <ChevronsUpDownIcon className="size-4 shrink-0 text-[var(--rd-color-text-muted)]" />}
        </AriaButton>
        <Popover placement={align === "end" ? "bottom end" : "bottom start"} offset={6} className={cx(panel, "min-w-56 overflow-auto", classNames?.popover)}>
          <div className={cx("flex items-center gap-3 border-b border-[var(--rd-color-border-default)] px-4 py-3", classNames?.header)}>
            <Avatar name={user.name} src={user.avatarUrl} size="md" decorative />
            <div className="flex min-w-0 flex-col">
              <span id={nameId} className="truncate text-sm font-medium">
                {user.name}
              </span>
              {user.email && <span className="truncate text-xs text-[var(--rd-color-text-muted)]">{user.email}</span>}
            </div>
          </div>
          <AriaMenu aria-labelledby={nameId} className={cx("flex flex-col p-1.5 outline-none", classNames?.list)}>
            {sections.map((group, g) => (
              <Fragment key={g}>
                {g > 0 && separator(`sep-${g}`)}
                {group.label ? <MenuSection title={group.label}>{group.items.map(entry)}</MenuSection> : group.items.map(entry)}
              </Fragment>
            ))}
            {showSignOut && sections.length > 0 && separator("sep-sign-out")}
            {showSignOut && (
              <MenuItem
                id="sign-out"
                textValue={signOutLabel}
                isDisabled={signOut.isDisabled}
                // Without a question first, the menu stays open so the entry can show that it is working.
                shouldCloseOnSelect={!!confirm && !isPending}
                onAction={() => {
                  if (!signOut.isAllowed || isPending) return;
                  if (confirm) {
                    setOpen(false);
                    setConfirmOpen(true);
                  } else void run();
                }}
                className={classNames?.item}
              >
                <span className="flex items-center gap-2">
                  {isPending && <Spinner className="size-4 shrink-0" />}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{isPending ? signingOutLabel : signOutLabel}</span>
                    {signOut.isDisabled && signOut.reason && <span className="truncate text-xs text-[var(--rd-color-text-muted)]">{signOut.reason}</span>}
                  </span>
                </span>
              </MenuItem>
            )}
          </AriaMenu>
          {themeRow && <div className={cx("border-t border-[var(--rd-color-border-default)] p-3", classNames?.theme)}>{themeRow}</div>}
        </Popover>
      </MenuTrigger>
      {confirm && (
        <AlertDialog
          isOpen={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel ?? signOutLabel}
          onConfirm={run}
        />
      )}
      {/* Always on the page, so the result is spoken after the menu and the dialog have closed. */}
      <span role="status" className={cx("sr-only", classNames?.status)}>
        {message}
      </span>
    </div>
  );
});
