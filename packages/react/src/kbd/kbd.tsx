import { forwardRef, type HTMLAttributes } from "react";
import { kbdDefaults, type KbdSpecProps } from "../generated/kbd.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface KbdProps extends KbdSpecProps, Omit<HTMLAttributes<HTMLElement>, keyof KbdSpecProps | "className"> {
  className?: string;
}

const sizes: Record<NonNullable<KbdSpecProps["size"]>, string> = {
  sm: "h-5 min-w-5 px-1 text-[11px]",
  md: "h-6 min-w-6 px-1.5 text-xs",
};

export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd({ children, size = kbdDefaults.size, className, ...rest }, ref) {
  return (
    <kbd
      {...rest}
      ref={ref}
      className={cx(
        // A keycap: a hairline border with a slightly heavier bottom edge, like a key with depth.
        "inline-flex items-center justify-center rounded-md border border-b-2 border-[var(--rd-color-border-default)] border-b-[var(--rd-color-border-strong)] " +
          "bg-[var(--rd-color-surface-subtle)] font-sans font-medium leading-none text-[var(--rd-color-text-muted)]",
        sizes[size],
        className,
      )}
    >
      {children}
    </kbd>
  );
});
