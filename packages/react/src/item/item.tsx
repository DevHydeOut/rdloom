"use client";

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Button as AriaButton, Link as AriaLink, type PressEvent } from "react-aria-components";
import { itemDefaults, type ItemSpecProps } from "../generated/item.types";
import { cx } from "../utils/cx";

type Variant = NonNullable<ItemSpecProps["variant"]>;
type Size = NonNullable<ItemSpecProps["size"]>;

interface ItemContextValue {
  size: Size;
}

const ItemContext = createContext<ItemContextValue>({ size: "md" });
const GroupContext = createContext(false);

export interface ItemProps
  extends Omit<ItemSpecProps, "onPress">,
    Omit<HTMLAttributes<HTMLElement>, keyof ItemSpecProps | "className" | "onClick"> {
  className?: string;
  onPress?: (event: PressEvent) => void;
}

const variants: Record<Variant, string> = {
  default: "border border-transparent",
  outline: "border border-[var(--rd-color-border-default)]",
  muted: "border border-transparent bg-[var(--rd-color-surface-subtle)]",
};

const sizes: Record<Size, string> = {
  sm: "gap-3 px-3 py-2",
  md: "gap-4 px-4 py-3",
};

const interactiveRow =
  "after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] " +
  "data-[focus-visible]:outline-none data-[focus-visible]:after:ring-2 data-[focus-visible]:after:ring-inset " +
  "data-[focus-visible]:after:ring-[var(--rd-color-focus-ring)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50";

/**
 * A list row. With `href` or `onPress` the whole row is a link or button; `ItemActions` is lifted out of it
 * and laid over the row, so the actions stay separate controls and nothing interactive is nested.
 */
export const Item = forwardRef<HTMLElement, ItemProps>(function Item(
  {
    children,
    variant = itemDefaults.variant,
    size = itemDefaults.size,
    href,
    onPress,
    isDisabled = itemDefaults.isDisabled,
    className,
    ...rest
  },
  ref,
) {
  const inGroup = useContext(GroupContext);
  const interactive = href !== undefined || onPress !== undefined;
  const Root = (inGroup ? "li" : "div") as "div";

  const rootClass = cx(
    "relative flex min-w-0 items-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-default)]",
    variants[variant],
    sizes[size],
    interactive && !isDisabled && "transition-colors motion-reduce:transition-none hover:bg-[var(--rd-color-surface-subtle)] active:bg-[var(--rd-color-surface-subtle)]",
    className,
  );

  let main: ReactNode = children;
  const actions: ReactNode[] = [];
  if (interactive) {
    const inside: ReactNode[] = [];
    for (const child of Children.toArray(children)) {
      if (isValidElement(child) && child.type === ItemActions) actions.push(child);
      else inside.push(child);
    }
    const linkClass = cx("flex min-w-0 flex-1 items-center text-start no-underline outline-none", size === "sm" ? "gap-3" : "gap-4", interactiveRow);
    const body = <>{inside}</>;
    main = href !== undefined ? (
      <AriaLink href={href} isDisabled={isDisabled} onPress={onPress} className={linkClass}>
        {body}
      </AriaLink>
    ) : (
      <AriaButton isDisabled={isDisabled} onPress={onPress} className={linkClass}>
        {body}
      </AriaButton>
    );
  }

  return (
    <ItemContext.Provider value={{ size }}>
      <Root {...(rest as HTMLAttributes<HTMLDivElement>)} ref={ref as never} className={rootClass}>
        {main}
        {actions}
      </Root>
    </ItemContext.Provider>
  );
});

export interface ItemMediaProps extends HTMLAttributes<HTMLDivElement> {
  /** icon: a bordered box around an icon. image: a picture that fills a rounded square. default: no frame (an avatar). */
  variant?: "default" | "icon" | "image";
}

export const ItemMedia = forwardRef<HTMLDivElement, ItemMediaProps>(function ItemMedia({ variant = "default", className, ...rest }, ref) {
  const { size } = useContext(ItemContext);
  return (
    <div
      {...rest}
      ref={ref}
      className={cx(
        "flex shrink-0 items-center justify-center",
        variant === "icon" &&
          cx(
            "rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] text-[var(--rd-color-text-muted)]",
            size === "sm" ? "size-8" : "size-10",
          ),
        variant === "image" && cx("overflow-hidden rounded-[var(--rd-radius-control)] [&_img]:size-full [&_img]:object-cover", size === "sm" ? "size-8" : "size-10"),
        className,
      )}
    />
  );
});

export const ItemContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ItemContent({ className, ...rest }, ref) {
  return <div {...rest} ref={ref} className={cx("flex min-w-0 flex-1 flex-col gap-0.5", className)} />;
});

export const ItemTitle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ItemTitle({ className, ...rest }, ref) {
  const { size } = useContext(ItemContext);
  return <div {...rest} ref={ref} className={cx("truncate font-medium text-[var(--rd-color-text-default)]", size === "sm" ? "text-sm" : "text-base", className)} />;
});

export const ItemDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ItemDescription({ className, ...rest }, ref) {
  return <div {...rest} ref={ref} className={cx("line-clamp-2 text-sm text-[var(--rd-color-text-muted)]", className)} />;
});

export const ItemActions = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ItemActions({ className, ...rest }, ref) {
  return <div {...rest} ref={ref} className={cx("relative z-10 flex shrink-0 items-center gap-2", className)} />;
});

export interface ItemGroupProps extends HTMLAttributes<HTMLUListElement> {}

/** A list of items. Each Item inside renders as a list item. */
export const ItemGroup = forwardRef<HTMLUListElement, ItemGroupProps>(function ItemGroup({ className, ...rest }, ref) {
  return (
    <GroupContext.Provider value>
      {/* role list is set on purpose: list-style resets can remove the role in some browsers */}
      <ul {...rest} ref={ref} role="list" className={cx("m-0 flex w-full list-none flex-col p-0", className)} />
    </GroupContext.Provider>
  );
});

/** A thin line between items. Inside a group it is a presentational list item so the list count stays right. */
export const ItemSeparator = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(function ItemSeparator({ className, ...rest }, ref) {
  return <li {...rest} ref={ref} role="presentation" aria-hidden="true" className={cx("my-1 h-px w-full list-none bg-[var(--rd-color-border-default)]", className)} />;
});
