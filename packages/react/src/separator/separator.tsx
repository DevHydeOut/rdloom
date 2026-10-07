import { forwardRef, type HTMLAttributes } from "react";
import { separatorDefaults, type SeparatorSpecProps } from "../generated/separator.types";
import { cx } from "../utils/cx";

export interface SeparatorProps
  extends SeparatorSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof SeparatorSpecProps | "className" | "children" | "role"> {
  className?: string;
}

const line = "bg-[var(--rd-color-border-default)]";

/** A divider. Semantic by default (role separator); with `decorative` it has role none and is skipped by assistive technology. */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  {
    orientation = separatorDefaults.orientation,
    label,
    decorative = separatorDefaults.decorative,
    className,
    ...rest
  },
  ref,
) {
  const vertical = orientation === "vertical";
  const a11y = decorative
    ? { role: "none" as const }
    : { role: "separator" as const, "aria-orientation": vertical ? ("vertical" as const) : undefined };

  if (vertical) {
    return <div {...rest} {...a11y} ref={ref} className={cx("h-full min-h-4 w-px self-stretch", line, className)} />;
  }

  if (!label) {
    return <div {...rest} {...a11y} ref={ref} className={cx("h-px w-full", line, className)} />;
  }

  // The label is real text inside the separator, so it is read once, as part of it.
  return (
    <div {...rest} {...a11y} ref={ref} className={cx("flex w-full items-center gap-3", className)}>
      <span aria-hidden="true" className={cx("h-px flex-1", line)} />
      <span className="text-sm text-[var(--rd-color-text-muted)]">{label}</span>
      <span aria-hidden="true" className={cx("h-px flex-1", line)} />
    </div>
  );
});
