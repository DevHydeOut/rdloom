"use client";

import { forwardRef, type ReactNode } from "react";
import {
  Button,
  Tree as AriaTree,
  TreeItem as AriaTreeItem,
  TreeItemContent,
  type Key,
  type TreeProps as AriaTreeProps,
} from "react-aria-components";
import { treeDefaults, type TreeSpecProps } from "../generated/tree.types";
import { cx } from "../utils/cx";
import { ChevronRightIcon } from "../utils/icons";

export interface TreeProps extends TreeSpecProps, Omit<AriaTreeProps<object>, keyof TreeSpecProps | "className" | "children" | "aria-label"> {
  className?: string;
}

export const Tree = forwardRef<HTMLDivElement, TreeProps>(function Tree(
  { label, children, selectionMode = treeDefaults.selectionMode, className, ...rest },
  ref,
) {
  return (
    <AriaTree
      {...rest}
      ref={ref}
      aria-label={label}
      selectionMode={selectionMode === "none" ? undefined : selectionMode}
      className={cx(
        "flex flex-col gap-0.5 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] " +
          "bg-[var(--rd-color-surface-default)] p-1.5 text-sm text-[var(--rd-color-text-default)] outline-none",
        className,
      )}
    >
      {children}
    </AriaTree>
  );
});

export interface TreeItemProps {
  /** Identifies the item in selectedKeys, expandedKeys and onAction. */
  id: Key;
  /** What the item shows. */
  title: ReactNode;
  /** Plain-text name, used for typeahead and by screen readers. Needed when title isn't a string. */
  textValue?: string;
  /** Nested TreeItems. */
  children?: ReactNode;
  className?: string;
}

const INDENT_PX = 18;

export function TreeItem({ id, title, textValue, children, className }: TreeItemProps) {
  return (
    <AriaTreeItem
      id={id}
      textValue={textValue ?? (typeof title === "string" ? title : String(id))}
      className={cx(
        "rounded-[var(--rd-radius-control)] outline-none transition-colors " +
          "data-[hovered]:bg-[var(--rd-color-surface-subtle)] " +
          "data-[selected]:bg-[var(--rd-color-surface-selected)] " +
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
        className,
      )}
    >
      <TreeItemContent>
        {({ hasChildItems, isExpanded, level }) => (
          <div className="flex min-h-8 items-center gap-1 pe-2" style={{ paddingInlineStart: (level - 1) * INDENT_PX + 4 }}>
            {hasChildItems ? (
              // Decorative for screen readers: aria-expanded on the item says the same thing.
              <Button slot="chevron" className="flex size-6 shrink-0 items-center justify-center rounded text-[var(--rd-color-text-muted)] outline-none">
                <ChevronRightIcon className={cx("size-4 transition-transform duration-150 motion-reduce:transition-none rtl:-scale-x-100", isExpanded && "rotate-90 rtl:-rotate-90")} />
              </Button>
            ) : (
              <span aria-hidden="true" className="size-6 shrink-0" />
            )}
            <span className="truncate">{title}</span>
          </div>
        )}
      </TreeItemContent>
      {children}
    </AriaTreeItem>
  );
}
