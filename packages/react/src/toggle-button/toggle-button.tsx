"use client";

import { createContext, forwardRef, useContext, type ReactNode } from "react";
import {
  ToggleButton as AriaToggleButton,
  ToggleButtonGroup as AriaToggleButtonGroup,
  type Key,
  type ToggleButtonProps as AriaToggleButtonProps,
} from "react-aria-components";
import { toggleButtonDefaults, type ToggleButtonSpecProps } from "../generated/toggle-button.types";
import { cx } from "../utils/cx";

type Size = NonNullable<ToggleButtonSpecProps["size"]>;
type Variant = NonNullable<ToggleButtonSpecProps["variant"]>;

/** A group tells its buttons the size and look to share, so each button stays a plain ToggleButton. */
const GroupContext = createContext<{ size?: Size; variant?: Variant }>({});

export interface ToggleButtonProps
  extends ToggleButtonSpecProps,
    Omit<AriaToggleButtonProps, keyof ToggleButtonSpecProps | "className" | "children"> {
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-[-0.005em] select-none whitespace-nowrap " +
  "rounded-[var(--rd-radius-control)] border outline-none transition-[background-color,border-color,color] " +
  "text-[var(--rd-color-text-default)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed " +
  "data-[selected]:font-semibold";

const variants: Record<Variant, string> = {
  default:
    "border-transparent bg-transparent data-[hovered]:bg-[var(--rd-color-surface-subtle)] " +
    "data-[selected]:bg-[var(--rd-color-action-primary)] data-[selected]:text-[var(--rd-color-action-on-primary)] data-[selected]:data-[hovered]:bg-[var(--rd-color-action-primary-hover)]",
  outline:
    "border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] [box-shadow:var(--rd-elevation-raised)] " +
    "data-[hovered]:border-[var(--rd-color-border-strong)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] " +
    "data-[selected]:border-[var(--rd-color-action-primary)] data-[selected]:bg-[var(--rd-color-surface-subtle)]",
};

// Icon-only buttons are square: the width follows the height.
const sizes: Record<Size, string> = {
  sm: "h-[var(--rd-size-control-sm)] min-w-[var(--rd-size-control-sm)] px-[var(--rd-space-control-x-sm)] text-sm",
  md: "h-[var(--rd-size-control-md)] min-w-[var(--rd-size-control-md)] px-[var(--rd-space-control-x)] text-sm",
  lg: "h-[var(--rd-size-control-lg)] min-w-[var(--rd-size-control-lg)] px-[var(--rd-space-control-x-lg)] text-base",
};

export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton(
  { size, variant, isDisabled = toggleButtonDefaults.isDisabled, className, children, ...rest },
  ref,
) {
  const group = useContext(GroupContext);
  const s = size ?? group.size ?? toggleButtonDefaults.size;
  const v = variant ?? group.variant ?? toggleButtonDefaults.variant;
  return (
    <AriaToggleButton {...rest} ref={ref} isDisabled={isDisabled} className={cx(base, variants[v], sizes[s], className)}>
      {children}
    </AriaToggleButton>
  );
});

export interface ToggleButtonGroupProps {
  /** What the group is, e.g. "Text style". It is the accessible name of the group. */
  label: string;
  /** ToggleButton elements, each with an id. */
  children: ReactNode;
  /** One pressed button at most (default), or any number. */
  selectionMode?: "single" | "multiple";
  selectedKeys?: Iterable<Key>;
  defaultSelectedKeys?: Iterable<Key>;
  onSelectionChange?: (keys: Set<Key>) => void;
  /** Keep one button pressed at all times. */
  disallowEmptySelection?: boolean;
  size?: Size;
  variant?: Variant;
  isDisabled?: boolean;
  className?: string;
}

/** Toggle buttons that share a name and arrow-key navigation, like a toolbar. */
export const ToggleButtonGroup = forwardRef<HTMLDivElement, ToggleButtonGroupProps>(function ToggleButtonGroup(
  {
    label,
    children,
    selectionMode = "single",
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    disallowEmptySelection,
    size = toggleButtonDefaults.size,
    variant = toggleButtonDefaults.variant,
    isDisabled,
    className,
  },
  ref,
) {
  return (
    <GroupContext.Provider value={{ size, variant }}>
      <AriaToggleButtonGroup
        ref={ref}
        aria-label={label}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        defaultSelectedKeys={defaultSelectedKeys}
        onSelectionChange={onSelectionChange}
        disallowEmptySelection={disallowEmptySelection}
        isDisabled={isDisabled}
        className={cx("inline-flex items-center gap-1", className)}
      >
        {children}
      </AriaToggleButtonGroup>
    </GroupContext.Provider>
  );
});
