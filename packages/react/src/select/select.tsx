"use client";

import { forwardRef } from "react";
import {
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
  Text,
  type ListBoxItemProps,
  type SelectProps as AriaSelectProps,
} from "react-aria-components";
import { selectDefaults, type SelectSpecProps } from "../generated/select.types";
import { cx } from "../utils/cx";
import { listItem } from "../utils/field";
import { CheckIcon, ChevronDownIcon } from "../utils/icons";

export interface SelectProps
  extends SelectSpecProps,
    Omit<AriaSelectProps<object>, keyof SelectSpecProps | "className" | "children"> {
  className?: string;
}

const sizes: Record<NonNullable<SelectSpecProps["size"]>, string> = {
  sm: "h-[var(--rd-size-control-sm)] px-[var(--rd-space-control-x-sm)] text-sm",
  md: "h-[var(--rd-size-control-md)] px-[var(--rd-space-control-x)] text-sm",
  lg: "h-[var(--rd-size-control-lg)] px-[var(--rd-space-control-x-lg)] text-base",
};

// Long lists (a year picker) open with the chosen option in view, not at the top.
function centerSelected(list: HTMLElement | null) {
  const item = list?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
  if (!list || !item) return;
  const offset = item.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
  list.scrollTop = offset - (list.clientHeight - item.offsetHeight) / 2;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(function Select(
  {
    label,
    description,
    errorMessage,
    placeholder = selectDefaults.placeholder,
    size = selectDefaults.size,
    isDisabled = selectDefaults.isDisabled,
    // Left undefined unless passed: React Aria treats any defined isInvalid as
    // controlled and would hide its own validation (required, min/max...).
    isInvalid,
    isRequired = selectDefaults.isRequired,
    children,
    className,
    ...rest
  },
  ref,
) {
  return (
    <AriaSelect
      {...rest}
      ref={ref}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isRequired={isRequired}
      className={cx("group flex flex-col gap-2", className)}
    >
      <Label className="text-sm font-medium text-[var(--rd-color-text-default)]">
        {label}
        {isRequired && <span aria-hidden="true" className="text-[var(--rd-color-feedback-danger)]"> *</span>}
      </Label>
      <Button
        className={cx(
          "flex w-full items-center justify-between gap-2 text-left outline-none transition-colors " +
            "bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] " +
            "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-control)] [box-shadow:var(--rd-elevation-raised)] " +
            "data-[hovered]:border-[var(--rd-color-border-strong)] " +
            "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[focus-visible]:border-[var(--rd-color-focus-ring)] " +
            "group-data-[invalid]:border-[var(--rd-color-feedback-danger)] " +
            "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
          sizes[size],
        )}
      >
        <SelectValue className="truncate data-[placeholder]:text-[var(--rd-color-text-muted)]" />
        <ChevronDownIcon />
      </Button>
      {description && (
        <Text slot="description" className="text-xs text-[var(--rd-color-text-muted)]">
          {description}
        </Text>
      )}
      <FieldError className="text-xs text-[var(--rd-color-feedback-danger)]">{errorMessage}</FieldError>
      <Popover
        className={
          "min-w-[var(--trigger-width)] overflow-auto p-1.5 [box-shadow:var(--rd-elevation-floating)] " +
          "bg-[var(--rd-color-surface-raised)] border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-overlay)]"
        }
      >
        <ListBox ref={centerSelected} className="max-h-72 overflow-auto outline-none">{children}</ListBox>
      </Popover>
    </AriaSelect>
  );
});

export interface SelectItemProps extends Omit<ListBoxItemProps, "className" | "children"> {
  className?: string;
  children: React.ReactNode;
}

export function SelectItem({ className, children, ...rest }: SelectItemProps) {
  return (
    <ListBoxItem
      {...rest}
      textValue={rest.textValue ?? (typeof children === "string" ? children : undefined)}
      className={cx(listItem, className)}
    >
      {({ isSelected }) => (
        <>
          <span className="truncate">{children}</span>
          {isSelected && <CheckIcon />}
        </>
      )}
    </ListBoxItem>
  );
}
