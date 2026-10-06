// Shared styles for fields built from a Group of segments (DatePicker,
// DateRangePicker). They match TextField and Select visually.

export type FieldSize = "sm" | "md" | "lg";

export const fieldLabel = "text-sm font-medium text-[var(--rd-color-text-default)]";
export const fieldHelp = "text-xs text-[var(--rd-color-text-muted)]";
export const fieldError = "text-xs text-[var(--rd-color-feedback-danger)]";

export const fieldGroup =
  "flex w-full items-center gap-1 bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] " +
  "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-control)] transition-colors [box-shadow:var(--rd-elevation-raised)] " +
  "data-[hovered]:border-[var(--rd-color-border-strong)] " +
  "data-[focus-within]:ring-2 data-[focus-within]:ring-[var(--rd-color-focus-ring)] data-[focus-within]:border-[var(--rd-color-focus-ring)] " +
  "data-[invalid]:border-[var(--rd-color-feedback-danger)] " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed";

export const fieldGroupSizes: Record<FieldSize, string> = {
  sm: "h-[var(--rd-size-control-sm)] pl-[var(--rd-space-control-x-sm)] pr-1 text-sm",
  md: "h-[var(--rd-size-control-md)] pl-[var(--rd-space-control-x)] pr-1 text-sm",
  lg: "h-[var(--rd-size-control-lg)] pl-[var(--rd-space-control-x-lg)] pr-1.5 text-base",
};

export const segment =
  "rounded px-0.5 tabular-nums outline-none caret-transparent " +
  "data-[placeholder]:text-[var(--rd-color-text-muted)] data-[type=literal]:px-0 data-[type=literal]:text-[var(--rd-color-text-muted)] " +
  "data-[focused]:bg-[var(--rd-color-action-primary)] data-[focused]:text-[var(--rd-color-action-on-primary)]";

export const iconButton =
  "ml-auto flex size-8 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] outline-none " +
  "text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

/** An option row in a Select or Combobox list. */
export const listItem =
  "flex cursor-default items-center justify-between gap-2 rounded-[var(--rd-radius-control)] px-2.5 py-2 text-sm outline-none " +
  "text-[var(--rd-color-text-default)] data-[focused]:bg-[var(--rd-color-surface-subtle)] " +
  "data-[selected]:font-medium data-[disabled]:opacity-50";

export const overlayPanel =
  "[box-shadow:var(--rd-elevation-floating)] p-1.5 bg-[var(--rd-color-surface-raised)] text-[var(--rd-color-text-default)] " +
  "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-overlay)]";
