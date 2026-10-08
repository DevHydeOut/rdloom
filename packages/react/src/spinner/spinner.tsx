import { forwardRef, type HTMLAttributes } from "react";
import { spinnerDefaults, type SpinnerSpecProps } from "../generated/spinner.types";
import { cx } from "../utils/cx";
import { SpinnerIcon } from "../utils/icons";

export interface SpinnerProps
  extends SpinnerSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof SpinnerSpecProps | "className" | "children" | "role"> {
  className?: string;
}

const sizes = {
  sm: "size-4",
  md: "size-5",
  lg: "size-8",
} as const;

/**
 * A loading indicator. It is a status region with the label as hidden text; with `decorative` it is
 * hidden from assistive technology. The arc stays still under reduced motion.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  {
    size = spinnerDefaults.size,
    label = spinnerDefaults.label,
    decorative = spinnerDefaults.decorative,
    className,
    ...rest
  },
  ref,
) {
  const a11y = decorative ? { "aria-hidden": true as const } : { role: "status" as const, "aria-label": label };
  return (
    <span
      {...rest}
      {...a11y}
      ref={ref}
      className={cx("relative inline-flex shrink-0 items-center justify-center align-middle text-[var(--rd-color-action-primary)]", className)}
    >
      <SpinnerIcon className={cx(sizes[size], "motion-reduce:animate-none")} />
      {!decorative && (
        <span className="absolute m-[-1px] h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]">{label}</span>
      )}
    </span>
  );
});
