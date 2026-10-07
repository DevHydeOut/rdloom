"use client";

import { useId, useState } from "react";
import {
  Button,
  ColorArea,
  ColorField,
  ColorPicker as AriaColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  ColorThumb,
  Dialog,
  DialogTrigger,
  Input,
  Popover,
  SliderTrack,
  parseColor,
  type Color,
} from "react-aria-components";
import { colorPickerDefaults, type ColorPickerSpecProps } from "../generated/color-picker.types";
import { cx } from "../utils/cx";
import { fieldError, fieldHelp, fieldLabel, overlayPanel } from "../utils/field";
import { ChevronDownIcon } from "../utils/icons";

type ColorFormat = NonNullable<ColorPickerSpecProps["format"]>;

const FALLBACK = "#000000";

function parse(value: string | undefined, fallback = FALLBACK): Color {
  try {
    return parseColor(value ?? fallback);
  } catch {
    return parseColor(fallback);
  }
}

/** The public value: lowercase hex, #rrggbb, or #rrggbbaa when opacity is on. */
const toHex = (color: Color, showAlpha: boolean) => color.toString(showAlpha ? "hexa" : "hex").toLowerCase();

function describe(color: Color, format: ColorFormat, showAlpha: boolean) {
  if (format === "rgb") return color.toString(showAlpha ? "rgba" : "rgb");
  if (format === "hsl") return color.toString(showAlpha ? "hsla" : "hsl");
  return toHex(color, showAlpha);
}

/**
 * Keeps the color as an object while exposing hex strings. The object stays in the picker so
 * hue and saturation are not lost when a grey or a black passes through a hex string.
 */
function useColorValue(value: string | undefined, defaultValue: string, showAlpha: boolean, onChange?: (value: string) => void) {
  const [color, setColor] = useState<Color>(() => parse(value, defaultValue));
  if (value !== undefined && value.toLowerCase() !== toHex(color, showAlpha)) {
    const next = parse(value, toHex(color, showAlpha));
    if (toHex(next, showAlpha) !== toHex(color, showAlpha)) setColor(next);
  }
  return {
    color,
    onChange(next: Color) {
      setColor(next);
      onChange?.(toHex(next, showAlpha));
    },
  };
}

const track = "h-6 w-full rounded-full border border-[var(--rd-color-border-strong)]";
const thumb =
  "top-1/2 size-5 rounded-full border-2 border-[var(--rd-color-surface-raised)] outline outline-1 outline-[var(--rd-color-text-default)] " +
  "data-[focus-visible]:size-6 data-[focus-visible]:ring-4 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[disabled]:opacity-50";

function ColorPanelBody({ presets, showAlpha, isDisabled }: { presets?: string[]; showAlpha: boolean; isDisabled?: boolean }) {
  return (
    <div className="flex w-64 max-w-full flex-col gap-4">
      <ColorArea
        colorSpace="hsb"
        xChannel="saturation"
        yChannel="brightness"
        isDisabled={isDisabled}
        className="h-40 w-full rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-strong)] data-[disabled]:opacity-50"
      >
        <ColorThumb className={thumb} />
      </ColorArea>
      <ColorSlider colorSpace="hsb" channel="hue" aria-label="Hue" isDisabled={isDisabled}>
        <SliderTrack className={track}>
          <ColorThumb className={thumb} />
        </SliderTrack>
      </ColorSlider>
      {showAlpha && (
        <ColorSlider colorSpace="hsb" channel="alpha" aria-label="Opacity" isDisabled={isDisabled}>
          <SliderTrack className={track}>
            <ColorThumb className={thumb} />
          </SliderTrack>
        </ColorSlider>
      )}
      <ColorField aria-label="Hex color" isDisabled={isDisabled} className="flex">
        <Input
          className={
            "h-[var(--rd-size-control-sm)] w-full rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] " +
            "px-[var(--rd-space-control-x-sm)] text-sm tabular-nums text-[var(--rd-color-text-default)] outline-none transition-colors " +
            "data-[hovered]:border-[var(--rd-color-border-strong)] data-[focused]:border-[var(--rd-color-focus-ring)] data-[focused]:ring-2 data-[focused]:ring-[var(--rd-color-focus-ring)] " +
            "data-[invalid]:border-[var(--rd-color-feedback-danger)] data-[disabled]:opacity-50"
          }
        />
      </ColorField>
      {presets && presets.length > 0 && (
        <ColorSwatchPicker aria-label="Preset colors" className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <ColorSwatchPickerItem
              key={preset}
              color={preset}
              className={
                "size-7 cursor-pointer rounded-[var(--rd-radius-control)] outline-none " +
                "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] " +
                "data-[selected]:outline data-[selected]:outline-2 data-[selected]:outline-offset-2 data-[selected]:outline-[var(--rd-color-text-default)]"
              }
            >
              <ColorSwatch className="size-full rounded-[inherit] border border-[var(--rd-color-border-strong)]" />
            </ColorSwatchPickerItem>
          ))}
        </ColorSwatchPicker>
      )}
    </div>
  );
}

export interface ColorPickerProps extends ColorPickerSpecProps {
  className?: string;
}

/** A button showing the color and its value; it opens the picker panel. The value is a hex string. */
export function ColorPicker({
  label,
  value,
  defaultValue = colorPickerDefaults.defaultValue,
  onChange,
  presets,
  showAlpha = colorPickerDefaults.showAlpha,
  format = colorPickerDefaults.format,
  description,
  errorMessage,
  isInvalid,
  isDisabled = colorPickerDefaults.isDisabled,
  name,
  className,
}: ColorPickerProps) {
  const labelId = useId();
  const buttonId = useId();
  const noteId = useId();
  const state = useColorValue(value, defaultValue, showAlpha, onChange);
  const note = isInvalid && errorMessage ? errorMessage : description;

  return (
    <AriaColorPicker value={state.color} onChange={state.onChange}>
      <div className={cx("flex flex-col gap-2", className)}>
        <span id={labelId} className={fieldLabel}>
          {label}
        </span>
        <DialogTrigger>
          <Button
            id={buttonId}
            isDisabled={isDisabled}
            aria-labelledby={`${labelId} ${buttonId}`}
            aria-describedby={note ? noteId : undefined}
            data-invalid={isInvalid || undefined}
            className={
              "flex h-[var(--rd-size-control-md)] w-full items-center gap-3 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] " +
              "bg-[var(--rd-color-surface-default)] px-[var(--rd-space-control-x-sm)] text-start text-sm text-[var(--rd-color-text-default)] outline-none " +
              "transition-colors [box-shadow:var(--rd-elevation-raised)] data-[hovered]:border-[var(--rd-color-border-strong)] " +
              "data-[focus-visible]:border-[var(--rd-color-focus-ring)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] " +
              "data-[invalid]:border-[var(--rd-color-feedback-danger)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
            }
          >
            <ColorSwatch className="size-5 shrink-0 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-strong)]" />
            <span className="flex-1 truncate tabular-nums">{describe(state.color, format, showAlpha)}</span>
            <ChevronDownIcon />
          </Button>
          <Popover placement="bottom start" offset={8} className={overlayPanel}>
            <Dialog aria-label={`${label} picker`} className="p-2.5 outline-none">
              <ColorPanelBody presets={presets} showAlpha={showAlpha} />
            </Dialog>
          </Popover>
        </DialogTrigger>
        {note && (
          <p id={noteId} className={isInvalid && errorMessage ? fieldError : fieldHelp}>
            {note}
          </p>
        )}
        {name && <input type="hidden" name={name} value={toHex(state.color, showAlpha)} />}
      </div>
    </AriaColorPicker>
  );
}

export interface ColorPickerPanelProps {
  /** Names the panel for screen readers, e.g. "Brand color". */
  label: string;
  /** Controlled color as hex: #rrggbb, or #rrggbbaa when showAlpha is on. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  presets?: string[];
  showAlpha?: boolean;
  isDisabled?: boolean;
  className?: string;
}

/** The picker panel on its own, without the button and popover, for a settings page or a sidebar. */
export function ColorPickerPanel({
  label,
  value,
  defaultValue = colorPickerDefaults.defaultValue,
  onChange,
  presets,
  showAlpha = colorPickerDefaults.showAlpha,
  isDisabled,
  className,
}: ColorPickerPanelProps) {
  const state = useColorValue(value, defaultValue, showAlpha, onChange);
  return (
    <AriaColorPicker value={state.color} onChange={state.onChange}>
      <div role="group" aria-label={label} className={cx("inline-flex rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] p-3", className)}>
        <ColorPanelBody presets={presets} showAlpha={showAlpha} isDisabled={isDisabled} />
      </div>
    </AriaColorPicker>
  );
}
