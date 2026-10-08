"use client";

import { createContext, forwardRef, useContext, type ReactNode } from "react";
import {
  ToggleButton as AriaToggleButton,
  ToggleButtonGroup as AriaToggleButtonGroup,
  type Key,
  type ToggleButtonProps as AriaToggleButtonProps,
} from "react-aria-components";
import { toggleGroupDefaults, type ToggleGroupSpecProps } from "../generated/toggle-group.types";
import { cx } from "../utils/cx";

type Size = NonNullable<ToggleGroupSpecProps["size"]>;
type Variant = NonNullable<ToggleGroupSpecProps["variant"]>;

const GroupContext = createContext<{ size: Size; variant: Variant }>({
  size: toggleGroupDefaults.size,
  variant: toggleGroupDefaults.variant,
});

export interface ToggleGroupProps
  extends Omit<ToggleGroupSpecProps, "children"> {
  /** ToggleGroupItem elements, each with an id. */
  children?: ReactNode;
  selectedKeys?: Iterable<Key>;
  defaultSelectedKeys?: Iterable<Key>;
  onSelectionChange?: (keys: Set<Key>) => void;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** Joined toggle buttons that share borders, one tab stop and arrow-key navigation. Needs an aria-label or aria-labelledby. */
export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup(
  {
    selectionMode = toggleGroupDefaults.selectionMode,
    orientation = toggleGroupDefaults.orientation,
    size = toggleGroupDefaults.size,
    variant = toggleGroupDefaults.variant,
    isDisabled = toggleGroupDefaults.isDisabled,
    disallowEmptySelection,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <GroupContext.Provider value={{ size, variant }}>
      <AriaToggleButtonGroup
        {...rest}
        ref={ref}
        selectionMode={selectionMode}
        orientation={orientation}
        isDisabled={isDisabled}
        disallowEmptySelection={disallowEmptySelection}
        className={cx("group/tg inline-flex", orientation === "vertical" ? "flex-col items-stretch" : "items-center", className)}
      >
        {children}
      </AriaToggleButtonGroup>
    </GroupContext.Provider>
  );
});

export interface ToggleGroupItemProps extends Omit<AriaToggleButtonProps, "className" | "children"> {
  /** Text or an icon. An icon-only item needs an aria-label. */
  children?: ReactNode;
  className?: string;
}

const base =
  "relative inline-flex items-center justify-center gap-2 font-medium tracking-[-0.005em] select-none whitespace-nowrap " +
  "border outline-none transition-[background-color,border-color,color] motion-reduce:transition-none " +
  "text-[var(--rd-color-text-default)] rounded-none " +
  "data-[focus-visible]:z-20 data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[selected]:z-10 data-[selected]:font-semibold " +
  // Joined: neighbours overlap by one border, and only the outer corners are rounded.
  "group-data-[orientation=horizontal]/tg:not-first:-ms-px group-data-[orientation=vertical]/tg:not-first:-mt-px " +
  "group-data-[orientation=horizontal]/tg:first:rounded-s-[var(--rd-radius-control)] group-data-[orientation=horizontal]/tg:last:rounded-e-[var(--rd-radius-control)] " +
  "group-data-[orientation=vertical]/tg:first:rounded-t-[var(--rd-radius-control)] group-data-[orientation=vertical]/tg:last:rounded-b-[var(--rd-radius-control)]";

const variants: Record<Variant, string> = {
  outline:
    "border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] " +
    "data-[hovered]:bg-[var(--rd-color-surface-subtle)] " +
    "data-[selected]:border-[var(--rd-color-action-primary)] data-[selected]:bg-[var(--rd-color-surface-subtle)]",
  ghost:
    "border-transparent bg-transparent data-[hovered]:bg-[var(--rd-color-surface-subtle)] " +
    "data-[selected]:border-[var(--rd-color-border-strong)] data-[selected]:bg-[var(--rd-color-surface-subtle)]",
};

const sizes: Record<Size, string> = {
  sm: "h-[var(--rd-size-control-sm)] min-w-[var(--rd-size-control-sm)] px-[var(--rd-space-control-x-sm)] text-sm",
  md: "h-[var(--rd-size-control-md)] min-w-[var(--rd-size-control-md)] px-[var(--rd-space-control-x)] text-sm",
  lg: "h-[var(--rd-size-control-lg)] min-w-[var(--rd-size-control-lg)] px-[var(--rd-space-control-x-lg)] text-base",
};

export const ToggleGroupItem = forwardRef<HTMLButtonElement, ToggleGroupItemProps>(function ToggleGroupItem(
  { className, children, ...rest },
  ref,
) {
  const { size, variant } = useContext(GroupContext);
  return (
    <AriaToggleButton {...rest} ref={ref} className={cx(base, variants[variant], sizes[size], className)}>
      {children}
    </AriaToggleButton>
  );
});
