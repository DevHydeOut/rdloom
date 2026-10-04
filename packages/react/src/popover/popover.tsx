import { forwardRef } from "react";
import {
  Dialog as AriaDialog,
  DialogTrigger,
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
} from "react-aria-components";
import { popoverDefaults, type PopoverSpecProps } from "../generated/popover.types";
import { Arrow } from "../utils/arrow";
import { cx } from "../utils/cx";

export { DialogTrigger as PopoverTrigger };

export interface PopoverProps
  extends PopoverSpecProps,
    Omit<AriaPopoverProps, keyof PopoverSpecProps | "className" | "children"> {
  className?: string;
}

export const Popover = forwardRef<HTMLElement, PopoverProps>(function Popover(
  {
    label,
    placement = popoverDefaults.placement,
    showArrow = popoverDefaults.showArrow,
    children,
    className,
    ...rest
  },
  ref,
) {
  return (
    <AriaPopover
      {...rest}
      ref={ref}
      placement={placement}
      offset={showArrow ? 12 : 8}
      className={cx(
        "shadow-lg bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] " +
          "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-overlay)]",
        className,
      )}
    >
      {showArrow && (
        <Arrow className="fill-[var(--rd-color-surface-raised)] stroke-[var(--rd-color-border-default)]" />
      )}
      <AriaDialog aria-label={label} className="p-4 outline-none">
        {children}
      </AriaDialog>
    </AriaPopover>
  );
});
