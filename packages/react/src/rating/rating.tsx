"use client";

import { useRef, useState } from "react";
import { Button, FieldError, Radio, RadioGroup, Text } from "react-aria-components";
import { useDefaultLocale } from "../utils/use-default-locale";
import { ratingDefaults, type RatingSpecProps } from "../generated/rating.types";
import { cx } from "../utils/cx";
import { fieldHelp, fieldLabel } from "../utils/field";
import { StarIcon } from "../utils/icons";

export interface RatingProps extends RatingSpecProps {
  className?: string;
}

// The cell is the click target (at least 24px); the icon is a little smaller than the cell.
const sizes = {
  sm: { cell: "size-6", icon: "size-5" },
  md: { cell: "size-8", icon: "size-6" },
  lg: { cell: "size-10", icon: "size-8" },
} as const;

const plural = (n: number) => `${n} ${n === 1 ? "star" : "stars"}`;
const tidy = (n: number) => String(Number(n.toFixed(1)));

/** How much of star `index` (1-based) is filled for a value: 0, 0.5 or 1. */
function fillOf(index: number, value: number, allowHalf: boolean): 0 | 0.5 | 1 {
  if (value >= index) return 1;
  if (allowHalf && value >= index - 0.5) return 0.5;
  return 0;
}

function Star({ fill, size }: { fill: 0 | 0.5 | 1; size: keyof typeof sizes }) {
  const icon = cx(sizes[size].icon, "shrink-0");
  return (
    <span className={cx("relative inline-block", sizes[size].icon)} aria-hidden="true">
      {/* An outline is always there; the filled star on top is the non-color cue. */}
      <StarIcon className={cx(icon, "text-[var(--rd-color-border-strong)]")} />
      {fill > 0 && (
        <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: fill === 1 ? "100%" : "50%" }}>
          <StarIcon filled className={cx(icon, "text-[var(--rd-color-action-primary)]")} />
        </span>
      )}
    </span>
  );
}

/**
 * A star rating. An input is a radio group named "Rating, 1 to 5 stars" whose radios are named
 * "3 stars". With isReadOnly it is a picture of the value with a text alternative.
 */
export function Rating({
  label,
  value,
  defaultValue = ratingDefaults.defaultValue,
  onChange,
  max = ratingDefaults.max,
  allowHalf = ratingDefaults.allowHalf,
  size = ratingDefaults.size,
  isReadOnly = ratingDefaults.isReadOnly,
  isDisabled = ratingDefaults.isDisabled,
  clearable = ratingDefaults.clearable,
  count,
  countLabel = ratingDefaults.countLabel,
  isLabelHidden = ratingDefaults.isLabelHidden,
  description,
  errorMessage,
  isInvalid,
  name,
  className,
}: RatingProps) {
  const locale = useDefaultLocale();
  const [inner, setInner] = useState(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const current = Math.min(max, Math.max(0, value ?? inner));
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  if (isReadOnly) {
    const shown = allowHalf ? Math.round(current * 2) / 2 : Math.round(current);
    return (
      <span className={cx("inline-flex items-center gap-2", className)}>
        <span role="img" aria-label={`${tidy(current)} out of ${max} stars`} className="inline-flex">
          {stars.map((i) => (
            <Star key={i} fill={fillOf(i, shown, allowHalf)} size={size} />
          ))}
        </span>
        {count !== undefined && (
          <span className="text-sm text-[var(--rd-color-text-muted)]">
            {new Intl.NumberFormat(locale).format(count)} {countLabel}
          </span>
        )}
      </span>
    );
  }

  const choose = (next: number) => {
    setInner(next);
    onChange?.(next);
  };
  const shown = hover ?? current;
  const choices = (i: number) => (allowHalf ? [i - 0.5, i] : [i]);

  return (
    <RadioGroup
      ref={groupRef}
      aria-label={`${label}, 1 to ${max} stars`}
      name={name}
      orientation="horizontal"
      value={current > 0 ? String(current) : null}
      onChange={(v) => choose(Number(v))}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      className={cx("flex flex-col gap-1.5", className)}
    >
      {!isLabelHidden && (
        <span aria-hidden="true" className={fieldLabel}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className={cx("flex", isDisabled && "opacity-50")} onPointerLeave={() => setHover(null)}>
          {stars.map((i) => (
            <span key={i} className={cx("relative inline-flex items-center justify-center", sizes[size].cell)}>
              <Star fill={fillOf(i, shown, allowHalf)} size={size} />
              {choices(i).map((v, half) => {
                const isLeft = allowHalf && half === 0;
                return (
                  <Radio
                    key={v}
                    value={String(v)}
                    aria-label={plural(v)}
                    onHoverStart={() => setHover(v)}
                    onHoverEnd={() => setHover(null)}
                    className={cx(
                      "absolute inset-y-0 cursor-pointer data-[disabled]:cursor-not-allowed",
                      allowHalf ? "w-1/2" : "inset-x-0",
                      isLeft ? "left-0" : allowHalf ? "right-0" : "",
                    )}
                  >
                    {({ isFocusVisible }) =>
                      isFocusVisible ? (
                        <span
                          className={cx(
                            "pointer-events-none absolute -inset-y-px rounded-[var(--rd-radius-control)] ring-2 ring-[var(--rd-color-focus-ring)]",
                            allowHalf ? (isLeft ? "-left-px w-[calc(200%+2px)]" : "-right-px w-[calc(200%+2px)]") : "-inset-x-px",
                          )}
                        />
                      ) : null
                    }
                  </Radio>
                );
              })}
            </span>
          ))}
        </div>
        {clearable && (
          <Button
            isDisabled={isDisabled || current === 0}
            aria-label="Clear rating"
            onPress={() => {
              choose(0);
              groupRef.current?.querySelector<HTMLInputElement>("input")?.focus();
            }}
            className={
              "rounded-[var(--rd-radius-control)] px-1.5 text-sm text-[var(--rd-color-text-muted)] underline outline-none " +
              "data-[hovered]:text-[var(--rd-color-text-default)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[disabled]:opacity-50"
            }
          >
            Clear
          </Button>
        )}
      </div>
      {description && (
        <Text slot="description" className={fieldHelp}>
          {description}
        </Text>
      )}
      <FieldError className="text-xs text-[var(--rd-color-feedback-danger)]">{errorMessage}</FieldError>
    </RadioGroup>
  );
}
