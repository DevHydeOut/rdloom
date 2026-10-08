"use client";

import { useId, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Button as AriaButton, Input, Label, SearchField } from "react-aria-components";
import { Button } from "../button/button";
import { FormSubmitButton, useFormState } from "../form/form";
import { Select, SelectItem } from "../select/select";
import { cx } from "../utils/cx";
import { CheckIcon, CloseIcon, SearchIcon } from "../utils/icons";
import { scrollHintYClass, useVerticalScrollHint } from "../utils/scroll-hint";
import type { ResolvedPermission } from "../utils/permissions";

export interface InvitePerson {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface InviteRole {
  id: string;
  label: string;
  description?: string;
}

export type InviteClassNames = Partial<
  Record<
    "dialog" | "form" | "list" | "message" | "toggle" | "search" | "results" | "counter" | "actions" | "cancelButton" | "submitButton" | "reason" | "status",
    string
  >
>;

export const people = (n: number) => (n === 1 ? "1 person" : `${n} people`);

export const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A list that shows about `rows` rows and then scrolls inside itself, with a fade where more is hidden. */
export function ScrollList({
  rows,
  rowHeight,
  gap = "0.5rem",
  className,
  watch,
  children,
}: {
  rows: number;
  rowHeight: string;
  gap?: string;
  className?: string;
  watch?: unknown;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hint = useVerticalScrollHint(ref, watch);
  const style: CSSProperties = { maxHeight: `calc(${rows} * ${rowHeight} + ${rows - 1} * ${gap} + 0.5rem)` };
  return (
    <div
      ref={ref}
      data-vhint={hint}
      style={style}
      className={cx("-mx-1 -my-1 overflow-y-auto overscroll-contain px-1 py-1", scrollHintYClass, className)}
    >
      {children}
    </div>
  );
}

/** The round pick mark: an empty ring, or a ring filled in the action colour with a check. */
export function CheckCircle({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors motion-reduce:transition-none",
        checked
          ? "border-[var(--rd-color-action-primary)] bg-[var(--rd-color-action-primary)]"
          : "border-[var(--rd-color-border-strong)] bg-transparent",
      )}
    >
      {checked && <CheckIcon className="size-3 text-[var(--rd-color-action-on-primary)]" strokeWidth={3} />}
    </span>
  );
}

export function SearchBox({
  label,
  placeholder,
  value,
  onChange,
  onKeyDown,
  className,
  autoFocus,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <SearchField
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      className={cx("group relative flex items-center", className)}
    >
      <Label className="sr-only">{label}</Label>
      <SearchIcon className="pointer-events-none absolute start-3 size-4 text-[var(--rd-color-text-muted)]" />
      <Input
        placeholder={placeholder}
        className={
          "h-[var(--rd-size-control-md)] w-full ps-9 pe-9 text-sm bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] outline-none " +
          "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-control)] [box-shadow:var(--rd-elevation-raised)] " +
          "placeholder:text-[var(--rd-color-text-muted)] [&::-webkit-search-cancel-button]:hidden " +
          "data-[hovered]:border-[var(--rd-color-border-strong)] " +
          "data-[focused]:ring-2 data-[focused]:ring-[var(--rd-color-focus-ring)] data-[focused]:border-[var(--rd-color-focus-ring)]"
        }
      />
      <AriaButton
        aria-label="Clear search"
        className={
          "absolute end-1.5 flex size-7 items-center justify-center rounded-[var(--rd-radius-control)] outline-none text-[var(--rd-color-text-muted)] " +
          "group-data-[empty]:hidden data-[hovered]:text-[var(--rd-color-text-default)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
        }
      >
        <CloseIcon />
      </AriaButton>
    </SearchField>
  );
}

/** A role select with its label hidden from view but kept for assistive technology. */
export function RoleSelect({
  label,
  roles,
  value,
  onChange,
  className,
}: {
  label: string;
  roles: InviteRole[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <Select
      label={label}
      size="sm"
      selectedKey={value}
      onSelectionChange={(key) => key != null && onChange(String(key))}
      className={cx("[&>:first-child]:sr-only", className)}
    >
      {roles.map((role) => (
        <SelectItem key={role.id} id={role.id} textValue={role.label}>
          {role.label}
        </SelectItem>
      ))}
    </Select>
  );
}

export const removeButton =
  "flex size-8 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] outline-none " +
  "text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

export interface FooterProps {
  access: ResolvedPermission;
  classNames?: InviteClassNames;
  /** Shown at the start of the footer, for example a count. */
  start?: ReactNode;
  secondaryLabel: string;
  onSecondary: () => void;
  /** "submit" sends the form; otherwise a plain button with this label and action. */
  primary: { kind: "submit"; label: string; isDisabled?: boolean } | { kind: "button"; label: string; onPress: () => void; isDisabled?: boolean };
  /** Two buttons of the same width, filling the row. */
  equal?: boolean;
}

export function Footer({ access, classNames, start, secondaryLabel, onSecondary, primary, equal }: FooterProps) {
  const { isPending } = useFormState();
  const reasonId = useId();
  const showReason = access.isDisabled && access.reason && primary.kind === "submit";
  return (
    <>
      {showReason && (
        <p id={reasonId} className={cx("text-sm text-[var(--rd-color-text-muted)]", classNames?.reason)}>
          {access.reason}
        </p>
      )}
      <div className={cx(equal ? "grid grid-cols-2 gap-3" : "flex flex-wrap items-center justify-end gap-2", classNames?.actions)}>
        {start && <div className="me-auto min-w-0 text-sm text-[var(--rd-color-text-muted)]">{start}</div>}
        <Button
          type="button"
          variant="secondary"
          isDisabled={isPending}
          onPress={onSecondary}
          className={cx(equal && "w-full", classNames?.cancelButton)}
        >
          {secondaryLabel}
        </Button>
        {primary.kind === "button" ? (
          <Button type="button" isDisabled={primary.isDisabled} onPress={primary.onPress} className={cx(equal && "w-full", classNames?.submitButton)}>
            {primary.label}
          </Button>
        ) : primary.isDisabled ? (
          <Button type="button" isDisabled className={cx(equal && "w-full", classNames?.submitButton)}>
            {primary.label}
          </Button>
        ) : access.isDisabled ? (
          // Looks disabled but stays in the tab order, so the reason can be reached.
          <Button
            type="button"
            aria-disabled="true"
            aria-describedby={access.reason ? reasonId : undefined}
            onPress={() => {}}
            className={cx("opacity-50 cursor-not-allowed", equal && "w-full", classNames?.submitButton)}
          >
            {primary.label}
          </Button>
        ) : (
          <FormSubmitButton className={cx(equal && "w-full", classNames?.submitButton)}>{primary.label}</FormSubmitButton>
        )}
      </div>
    </>
  );
}
