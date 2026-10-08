"use client";

import { useContext, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from "react";
import {
  Button,
  Collection,
  ComboBox as AriaComboBox,
  ComboBoxStateContext,
  FieldError,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxLoadMoreItem,
  ListLayout,
  Popover,
  Text,
  Virtualizer,
  type ComboBoxProps as AriaComboBoxProps,
  type Key,
  type ListBoxItemProps,
} from "react-aria-components";
import { comboboxDefaults, type ComboboxSpecProps } from "../generated/combobox.types";
import { cx } from "../utils/cx";
import { fieldError, fieldHelp, fieldLabel, iconButton, listItem, overlayPanel, type FieldSize } from "../utils/field";
import { CheckIcon, ChevronDownIcon, CloseIcon, SpinnerIcon } from "../utils/icons";

type Mode = "single" | "multiple";

// value/onChange come from React Aria so their types follow selectionMode:
// Key | null for "single", Key[] for "multiple".
export interface ComboboxProps<T extends object, M extends Mode = "single">
  extends Omit<ComboboxSpecProps, "value" | "selectionMode">,
    Omit<AriaComboBoxProps<T, M>, keyof ComboboxSpecProps | "className" | "children"> {
  selectionMode?: M;
  value?: AriaComboBoxProps<T, M>["value"];
  className?: string;
  /** ComboboxItem elements, or a function that renders one per item in `items`/`defaultItems`. */
  children: ReactNode | ((item: T) => ReactNode);
}

const fieldSizes: Record<FieldSize, string> = {
  sm: "min-h-[var(--rd-size-control-sm)] ps-1.5 pe-1 text-sm",
  md: "min-h-[var(--rd-size-control-md)] ps-2 pe-1 text-sm",
  lg: "min-h-[var(--rd-size-control-lg)] ps-2.5 pe-1.5 text-base",
};
const rowHeights: Record<FieldSize, number> = { sm: 30, md: 32, lg: 36 };

/** Tracks an element's width, e.g. to size a popover to its anchor. */
function useElementWidth(ref: RefObject<HTMLElement | null>): number | undefined {
  const [width, setWidth] = useState<number>();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.offsetWidth);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setWidth(el.offsetWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

interface FieldProps {
  /** Whatever the installed React calls a div's ref: the shape changed in 19. */
  fieldRef: ComponentProps<"div">["ref"];
  size: FieldSize;
  isMultiple: boolean;
  isLoading: boolean;
  placeholder?: string;
}

/** The bordered field: tags (multiple mode), the input, a spinner and the open button. */
function Field({ fieldRef, size, isMultiple, isLoading, placeholder }: FieldProps) {
  const state = useContext(ComboBoxStateContext);
  // React Aria renders children once without state while building the
  // option collection; the field only matters in the real render.
  if (!state) return null;
  const selected = isMultiple ? state.selectedItems : [];

  const remove = (key: Key) => {
    state.setValue((state.value as readonly Key[]).filter((k) => k !== key));
  };

  return (
    <div
      ref={fieldRef}
      className={cx(
        "flex w-full flex-wrap items-center gap-1 bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] " +
          "border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-control)] transition-colors [box-shadow:var(--rd-elevation-raised)] " +
          "hover:border-[var(--rd-color-border-strong)] " +
          "focus-within:ring-2 focus-within:ring-[var(--rd-color-focus-ring)] focus-within:border-[var(--rd-color-focus-ring)] " +
          "group-data-[invalid]:border-[var(--rd-color-feedback-danger)] group-data-[disabled]:opacity-50",
        fieldSizes[size],
      )}
    >
      {selected.map((item) => (
        <span
          key={item.key}
          className="inline-flex items-center gap-1 rounded-[calc(var(--rd-radius-control)-2px)] bg-[var(--rd-color-surface-subtle)] py-0.5 ps-2 pe-0.5 text-xs font-medium"
        >
          {item.textValue}
          {/* A plain <button> on purpose: React Aria's ComboBox passes its
              "open the list" behavior to every <Button> inside it. */}
          <button
            type="button"
            aria-label={`Remove ${item.textValue}`}
            onClick={() => remove(item.key)}
            className={
              "-my-1 flex size-6 items-center justify-center rounded-sm outline-none text-[var(--rd-color-text-muted)] " +
              "hover:text-[var(--rd-color-text-default)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
            }
          >
            <CloseIcon />
          </button>
        </span>
      ))}
      <Input
        placeholder={selected.length > 0 ? undefined : placeholder}
        onKeyDown={(e) => {
          if (isMultiple && e.key === "Backspace" && state.inputValue === "" && selected.length > 0) {
            remove(selected[selected.length - 1].key);
          }
        }}
        className="h-7 min-w-16 flex-1 bg-transparent px-1 outline-none placeholder:text-[var(--rd-color-text-muted)]"
      />
      {isLoading && (
        <span className="text-[var(--rd-color-text-muted)]" role="status" aria-label="Loading">
          <SpinnerIcon />
        </span>
      )}
      <Button className={cx(iconButton, "ml-0 size-7")}>
        <ChevronDownIcon />
      </Button>
    </div>
  );
}

export function Combobox<T extends object, M extends Mode = "single">({
  label,
  description,
  errorMessage,
  placeholder,
  size = comboboxDefaults.size,
  selectionMode,
  allowsCustomValue = comboboxDefaults.allowsCustomValue,
  menuTrigger = comboboxDefaults.menuTrigger,
  isLoading = comboboxDefaults.isLoading,
  virtualized = comboboxDefaults.virtualized,
  emptyMessage = comboboxDefaults.emptyMessage,
  isDisabled = comboboxDefaults.isDisabled,
  // Left undefined unless passed: React Aria treats any defined isInvalid as
  // controlled and would hide its own validation (required, min/max...).
  isInvalid,
  isRequired = comboboxDefaults.isRequired,
  onLoadMore,
  children,
  className,
  ...rest
}: ComboboxProps<T, M>) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const fieldWidth = useElementWidth(fieldRef);
  const isMultiple = (selectionMode ?? comboboxDefaults.selectionMode) === "multiple";

  // With onLoadMore the options go in a Collection so a load-more sentinel can follow them.
  const options = onLoadMore ? (
    <>
      <Collection items={rest.items ?? rest.defaultItems}>{children}</Collection>
      <ListBoxLoadMoreItem onLoadMore={onLoadMore} isLoading={isLoading} className="flex justify-center py-2 text-[var(--rd-color-text-muted)]">
        {/* While loading, React Aria exposes this row as an option; without
            text, screen readers announce a blank extra item. */}
        <SpinnerIcon />
        <span className="sr-only">Loading more…</span>
      </ListBoxLoadMoreItem>
    </>
  ) : (
    children
  );

  const listBox = (
    <ListBox
      className="max-h-72 overflow-auto p-1 outline-none"
      renderEmptyState={() => (
        <div className="px-2.5 py-2 text-sm text-[var(--rd-color-text-muted)]">{isLoading ? "Loading…" : emptyMessage}</div>
      )}
    >
      {options as ReactNode}
    </ListBox>
  );

  return (
    <AriaComboBox<T, M>
      {...(rest as AriaComboBoxProps<T, M>)}
      selectionMode={selectionMode}
      allowsCustomValue={allowsCustomValue && !isMultiple}
      menuTrigger={menuTrigger}
      allowsEmptyCollection
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      isRequired={isRequired}
      className={cx("group flex flex-col gap-2", className)}
    >
      <Label className={fieldLabel}>
        {label}
        {isRequired && <span aria-hidden="true" className="text-[var(--rd-color-feedback-danger)]"> *</span>}
      </Label>
      <Field fieldRef={fieldRef} size={size} isMultiple={isMultiple} isLoading={isLoading} placeholder={placeholder} />
      {description && (
        <Text slot="description" className={fieldHelp}>
          {description}
        </Text>
      )}
      <FieldError className={fieldError}>{errorMessage}</FieldError>
      {/* Anchor to and match the whole field. React Aria's own --trigger-width
          only spans the input and button, which is narrow once tags are shown. */}
      <Popover triggerRef={fieldRef} className={overlayPanel} style={{ width: fieldWidth }}>
        {virtualized ? (
          <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: rowHeights[size], padding: 4 }}>
            {listBox}
          </Virtualizer>
        ) : (
          listBox
        )}
      </Popover>
    </AriaComboBox>
  );
}

export interface ComboboxItemProps extends Omit<ListBoxItemProps, "className" | "children"> {
  className?: string;
  children: ReactNode;
}

export function ComboboxItem({ className, children, ...rest }: ComboboxItemProps) {
  return (
    <ListBoxItem
      {...rest}
      textValue={rest.textValue ?? (typeof children === "string" ? children : undefined)}
      className={cx(listItem, className)}
    >
      {({ isSelected }) => (
        <>
          <span className="truncate">{children}</span>
          {isSelected && <CheckIcon />}
        </>
      )}
    </ListBoxItem>
  );
}
