import { forwardRef, type HTMLAttributes } from "react";
import { Avatar } from "../avatar/avatar";
import { avatarGroupDefaults, type AvatarGroupSpecProps } from "../generated/avatar-group.types";
import { cx } from "../utils/cx";

export interface AvatarGroupProps
  extends AvatarGroupSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof AvatarGroupSpecProps | "className" | "children" | "role"> {
  className?: string;
}

const sizes: Record<NonNullable<AvatarGroupSpecProps["size"]>, { overlap: string; chip: string }> = {
  xs: { overlap: "-ms-1.5", chip: "size-6 text-[10px]" },
  sm: { overlap: "-ms-1.5", chip: "size-8 text-xs" },
  md: { overlap: "-ms-2", chip: "size-10 text-sm" },
  lg: { overlap: "-ms-3.5", chip: "size-14 text-base" },
};

/** "Team members: Ada Lovelace, Grace Hopper and 3 more". */
export function avatarGroupName(label: string, names: string[], shown: number): string {
  const list = names.slice(0, shown);
  const more = names.length - list.length;
  const people =
    more > 0
      ? `${list.join(", ")} and ${more} more`
      : list.length > 1
        ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`
        : list.join("");
  return people ? `${label}: ${people}` : label;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { avatars, max = avatarGroupDefaults.max, size = avatarGroupDefaults.size, label = avatarGroupDefaults.label, className, ...rest },
  ref,
) {
  const shown = Math.max(0, Math.floor(max));
  const visible = avatars.slice(0, shown);
  const more = avatars.length - visible.length;
  const s = sizes[size];
  // The group is one picture with one name; the avatars inside are decorative so nothing is read twice.
  const name = avatarGroupName(label, avatars.map((a) => a.name), visible.length);
  const ring = "ring-2 ring-[var(--rd-color-surface-default)]";
  return (
    <div {...rest} ref={ref} role="img" aria-label={name} className={cx("inline-flex items-center", className)}>
      {visible.map((a, i) => (
        <Avatar key={`${a.name}-${i}`} name={a.name} src={a.src} size={size} decorative className={cx(ring, i > 0 && s.overlap)} />
      ))}
      {more > 0 && (
        <span
          aria-hidden="true"
          className={cx(
            "inline-flex shrink-0 select-none items-center justify-center rounded-full border border-[var(--rd-color-border-default)] " +
              "bg-[var(--rd-color-surface-subtle)] font-medium text-[var(--rd-color-text-default)]",
            ring,
            s.chip,
            visible.length > 0 && s.overlap,
          )}
        >
          {`+${more}`}
        </span>
      )}
    </div>
  );
});
