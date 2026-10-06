"use client";

import { createContext, forwardRef, useContext } from "react";
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
  type TabListProps as AriaTabListProps,
  type TabPanelProps as AriaTabPanelProps,
  type TabProps as AriaTabProps,
  type TabsProps as AriaTabsProps,
} from "react-aria-components";
import { tabsDefaults, type TabsSpecProps } from "../generated/tabs.types";
import { cx } from "../utils/cx";

type Variant = NonNullable<TabsSpecProps["variant"]>;

// Tab and TabList read the variant from here, so it's set once on <Tabs>.
const VariantContext = createContext<Variant>(tabsDefaults.variant);

export interface TabsProps
  extends TabsSpecProps,
    Omit<AriaTabsProps, keyof TabsSpecProps | "className" | "children"> {
  className?: string;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    variant = tabsDefaults.variant,
    orientation = tabsDefaults.orientation,
    isDisabled = tabsDefaults.isDisabled,
    children,
    className,
    ...rest
  },
  ref,
) {
  return (
    <VariantContext.Provider value={variant}>
      <AriaTabs
        {...rest}
        ref={ref}
        orientation={orientation}
        isDisabled={isDisabled}
        className={cx("flex gap-4 data-[orientation=horizontal]:flex-col", className)}
      >
        {children}
      </AriaTabs>
    </VariantContext.Provider>
  );
});

const listStyles: Record<Variant, string> = {
  underline:
    "border-[var(--rd-color-border-default)] data-[orientation=horizontal]:border-b-2 data-[orientation=vertical]:border-r-2",
  pill: "rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] p-1",
};

export interface TabListProps<T extends object> extends Omit<AriaTabListProps<T>, "className"> {
  className?: string;
}

export function TabList<T extends object>({ className, ...rest }: TabListProps<T>) {
  const variant = useContext(VariantContext);
  return (
    <AriaTabList
      {...rest}
      className={cx("flex gap-1 data-[orientation=vertical]:flex-col", listStyles[variant], className)}
    />
  );
}

const tabStyles: Record<Variant, string> = {
  underline:
    "-mb-0.5 h-[var(--rd-size-control-sm)] border-b-2 border-transparent px-3 " +
    "data-[selected]:border-[var(--rd-color-action-primary)] data-[selected]:text-[var(--rd-color-text-default)]",
  pill:
    "h-[var(--rd-size-control-sm)] rounded-[calc(var(--rd-radius-control)-2px)] px-3 " +
    "data-[selected]:bg-[var(--rd-color-surface-raised)] data-[selected]:text-[var(--rd-color-text-default)] data-[selected]:[box-shadow:var(--rd-elevation-raised)]",
};

export interface TabProps extends Omit<AriaTabProps, "className"> {
  className?: string;
}

export function Tab({ className, ...rest }: TabProps) {
  const variant = useContext(VariantContext);
  return (
    <AriaTab
      {...rest}
      className={cx(
        "flex cursor-default items-center text-sm font-medium outline-none transition-colors text-[var(--rd-color-text-muted)] " +
          "data-[hovered]:text-[var(--rd-color-text-default)] " +
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] " +
          "data-[disabled]:opacity-50",
        tabStyles[variant],
        className,
      )}
    />
  );
}

export interface TabPanelProps extends Omit<AriaTabPanelProps, "className"> {
  className?: string;
}

export function TabPanel({ className, ...rest }: TabPanelProps) {
  return (
    <AriaTabPanel
      {...rest}
      className={cx(
        "flex-1 outline-none text-[var(--rd-color-text-default)] " +
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] rounded-[var(--rd-radius-control)]",
        className,
      )}
    />
  );
}
