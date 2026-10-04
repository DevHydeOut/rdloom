import { forwardRef } from "react";
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from "react-aria-components";
import { switchDefaults, type SwitchSpecProps } from "../generated/switch.types";
import { cx } from "../utils/cx";

export interface SwitchProps
  extends SwitchSpecProps,
    Omit<AriaSwitchProps, keyof SwitchSpecProps | "className" | "children"> {
  className?: string;
}

const track: Record<NonNullable<SwitchSpecProps["size"]>, string> = { sm: "h-4 w-7", md: "h-5 w-9" };
const thumb: Record<NonNullable<SwitchSpecProps["size"]>, string> = {
  sm: "size-3 group-data-[selected]:translate-x-3",
  md: "size-4 group-data-[selected]:translate-x-4",
};

export const Switch = forwardRef<HTMLLabelElement, SwitchProps>(function Switch(
  {
    children,
    defaultSelected = switchDefaults.defaultSelected,
    size = switchDefaults.size,
    isDisabled = switchDefaults.isDisabled,
    className,
    ...rest
  },
  ref,
) {
  return (
    <AriaSwitch
      {...rest}
      ref={ref}
      defaultSelected={defaultSelected}
      isDisabled={isDisabled}
      className={cx(
        "group inline-flex items-center gap-2 text-sm text-[var(--rd-color-text-default)] cursor-pointer " +
          "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "flex shrink-0 items-center rounded-full p-0.5 transition-colors bg-[var(--rd-color-border-strong)] " +
            "group-data-[selected]:bg-[var(--rd-color-action-primary)] " +
            "group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-offset-2 group-data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
          track[size],
        )}
      >
        <span
          className={cx(
            "rounded-full bg-[var(--rd-color-surface-default)] shadow-sm transition-transform motion-reduce:transition-none",
            thumb[size],
          )}
        />
      </span>
      {children}
    </AriaSwitch>
  );
});
