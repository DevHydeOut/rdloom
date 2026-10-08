"use client";

import { createContext, forwardRef, useContext, useState, type ReactNode } from "react";
import { ToggleButton, ToggleButtonGroup, type Key } from "react-aria-components";
import { segmentedControlDefaults, type SegmentedControlSpecProps } from "../generated/segmented-control.types";
import { cx } from "../utils/cx";

export interface SegmentedControlProps extends SegmentedControlSpecProps {
  className?: string;
}

/** How an item tells its group it was chosen: by click, Space, or by arriving on it with an arrow key. */
const ChooseContext = createContext<(key: Key) => void>(() => {});

export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(function SegmentedControl(
  {
    label,
    children,
    selectedKey,
    defaultSelectedKey,
    onChange,
    size = segmentedControlDefaults.size,
    isDisabled = segmentedControlDefaults.isDisabled,
    className,
  },
  ref,
) {
  // Kept here even when uncontrolled, so choosing the option that is already chosen can be told apart from a change.
  const [inner, setInner] = useState<Key | undefined>(defaultSelectedKey);
  const current = selectedKey ?? inner;
  const choose = (key: Key) => {
    if (key === current) return;
    if (selectedKey === undefined) setInner(key);
    onChange?.(key);
  };
  return (
    <ChooseContext.Provider value={choose}>
      <ToggleButtonGroup
        ref={ref}
        aria-label={label}
        selectionMode="single"
        disallowEmptySelection
        isDisabled={isDisabled}
        selectedKeys={current === undefined ? [] : [current]}
        onSelectionChange={(keys) => {
          const next = [...keys][0] as Key | undefined;
          if (next !== undefined) choose(next);
        }}
        // The size reaches the items through this attribute, so each item stays a plain ToggleButton.
        data-size={size}
        className={cx(
          "group inline-flex max-w-full gap-0.5 overflow-x-auto rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] " +
            "bg-[var(--rd-color-surface-subtle)] p-0.5 data-[disabled]:opacity-50",
          className,
        )}
      >
        {children}
      </ToggleButtonGroup>
    </ChooseContext.Provider>
  );
});

export interface SegmentedControlItemProps {
  /** Identifies the option in selectedKey and onChange. */
  id: Key;
  children: ReactNode;
  className?: string;
}

export function SegmentedControlItem({ id, children, className }: SegmentedControlItemProps) {
  const choose = useContext(ChooseContext);
  return (
    <ToggleButton
      id={id}
      // A radio group chooses as focus moves, so arrow keys pick the next option.
      onFocus={() => choose(id)}
      className={cx(
        "inline-flex items-center justify-center rounded-[calc(var(--rd-radius-control)-2px)] font-medium whitespace-nowrap select-none outline-none transition-colors",
        "h-[calc(var(--rd-size-control-md)-0.25rem)] px-[var(--rd-space-control-x)] text-sm group-data-[size=sm]:h-[calc(var(--rd-size-control-sm)-0.25rem)] group-data-[size=sm]:px-[var(--rd-space-control-x-sm)]",
        "text-[var(--rd-color-text-default)] data-[hovered]:bg-[var(--rd-color-surface-default)] " +
          "data-[selected]:bg-[var(--rd-color-action-primary)] data-[selected]:text-[var(--rd-color-action-on-primary)] data-[selected]:font-semibold data-[selected]:[box-shadow:var(--rd-elevation-raised)] " +
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[focus-visible]:ring-offset-1 " +
          "data-[disabled]:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </ToggleButton>
  );
}
