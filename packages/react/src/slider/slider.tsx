"use client";

import {
  Label,
  Slider as AriaSlider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  type SliderProps as AriaSliderProps,
} from "react-aria-components";
import { sliderDefaults, type SliderSpecProps } from "../generated/slider.types";
import { cx } from "../utils/cx";
import { fieldLabel } from "../utils/field";

export interface SliderProps
  extends SliderSpecProps,
    Omit<AriaSliderProps<number | number[]>, keyof SliderSpecProps | "className" | "children"> {
  className?: string;
}

const thumb =
  "top-1/2 size-6 rounded-full border-2 border-[var(--rd-color-action-primary)] bg-[var(--rd-color-surface-raised)] shadow-sm outline-none " +
  "transition-[box-shadow] data-[dragging]:shadow-md data-[focus-visible]:ring-4 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] " +
  "data-[disabled]:border-[var(--rd-color-border-strong)]";

export function Slider({
  label,
  minValue = sliderDefaults.minValue,
  maxValue = sliderDefaults.maxValue,
  step = sliderDefaults.step,
  showValue = sliderDefaults.showValue,
  isDisabled = sliderDefaults.isDisabled,
  className,
  ...rest
}: SliderProps) {
  return (
    <AriaSlider
      {...rest}
      minValue={minValue}
      maxValue={maxValue}
      step={step}
      isDisabled={isDisabled}
      className={cx("group flex w-full flex-col gap-2", className)}
    >
      <div className="flex items-baseline justify-between gap-4">
        {/* Disabled dims only the track and thumb: the label and value stay
            readable (muted, still 4.5:1), so people know what the setting is. */}
        <Label className={cx(fieldLabel, "group-data-[disabled]:text-[var(--rd-color-text-muted)]")}>{label}</Label>
        {showValue && (
          // Ranges show "min – max" with the locale's formatting.
          <SliderOutput className="text-sm tabular-nums text-[var(--rd-color-text-muted)]">
            {({ state }) => state.values.map((_, i) => state.getThumbValueLabel(i)).join(" – ")}
          </SliderOutput>
        )}
      </div>
      <SliderTrack className="relative h-6 w-full group-data-[disabled]:opacity-50">
        {({ state }) => {
          const range = state.values.length > 1;
          const start = range ? state.getThumbPercent(0) : 0;
          const end = state.getThumbPercent(range ? 1 : 0);
          return (
            <>
              <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-[var(--rd-color-surface-subtle)]" />
              <div
                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--rd-color-action-primary)] group-data-[disabled]:bg-[var(--rd-color-border-strong)]"
                style={{ insetInlineStart: `${start * 100}%`, width: `${(end - start) * 100}%` }}
              />
              {state.values.map((_, i) => (
                <SliderThumb key={i} index={i} className={thumb} aria-label={range ? (i === 0 ? "Minimum" : "Maximum") : undefined} />
              ))}
            </>
          );
        }}
      </SliderTrack>
    </AriaSlider>
  );
}
