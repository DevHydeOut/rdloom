import { forwardRef, type HTMLAttributes } from "react";
import { emptyStateDefaults, type EmptyStateSpecProps } from "../generated/empty-state.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface EmptyStateProps
  extends EmptyStateSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof EmptyStateSpecProps | "className" | "title"> {
  className?: string;
}

const sizes: Record<NonNullable<EmptyStateSpecProps["size"]>, { box: string; icon: string; title: string }> = {
  sm: { box: "gap-2 px-4 py-6", icon: "size-10", title: "text-sm" },
  md: { box: "gap-3 px-6 py-12", icon: "size-12", title: "text-base" },
};

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  {
    title,
    description,
    icon,
    children,
    headingLevel = emptyStateDefaults.headingLevel,
    size = emptyStateDefaults.size,
    className,
    ...rest
  },
  ref,
) {
  const level = Math.min(6, Math.max(2, Math.round(headingLevel)));
  const Heading = `h${level}` as "h2";
  const look = sizes[size];
  return (
    <div
      {...rest}
      ref={ref}
      className={cx(
        "flex flex-col items-center rounded-[var(--rd-radius-overlay)] border border-dashed border-[var(--rd-color-border-default)] text-center",
        look.box,
        className,
      )}
    >
      {icon && (
        // A soft disc behind the icon: the picture is decoration, the words are the message.
        <div
          aria-hidden="true"
          className={cx(
            "flex items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] text-[var(--rd-color-text-muted)] " +
              "ring-1 ring-[var(--rd-color-border-default)] [&>svg]:size-1/2",
            look.icon,
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex max-w-sm flex-col gap-1">
        <Heading className={cx("font-semibold tracking-tight text-[var(--rd-color-text-default)]", look.title)}>{title}</Heading>
        {description && <p className="text-sm text-balance text-[var(--rd-color-text-muted)]">{description}</p>}
      </div>
      {children && <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
});
