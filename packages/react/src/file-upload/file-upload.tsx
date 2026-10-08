"use client";

import { forwardRef, useId, useState } from "react";
import { Button as AriaButton, DropZone, FileTrigger, Text } from "react-aria-components";
import { Button } from "../button/button";
import { fileUploadDefaults, type FileUploadSpecProps } from "../generated/file-upload.types";
import { cx } from "../utils/cx";
import { CloseIcon, FileIcon, UploadIcon } from "../utils/icons";

export interface FileUploadProps extends FileUploadSpecProps {
  className?: string;
}

type Reason = "type" | "size" | "count";

/** "1.2 MB", "840 KB", "12 B". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 10 || Number.isInteger(value) ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

/** Does `file` match an accept list of MIME types ("image/png", "image/*") and extensions (".pdf")? */
export function matchesAccept(file: { name: string; type: string }, accept?: readonly string[]): boolean {
  if (!accept || accept.length === 0) return true;
  const name = file.name.toLocaleLowerCase();
  const type = file.type.toLocaleLowerCase();
  return accept.some((rule) => {
    const r = rule.trim().toLocaleLowerCase();
    if (r.startsWith(".")) return name.endsWith(r);
    if (r.endsWith("/*")) return type.startsWith(r.slice(0, -1));
    return type === r;
  });
}

const same = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(function FileUpload(
  {
    label,
    description,
    accept,
    multiple = fileUploadDefaults.multiple,
    maxSize,
    maxFiles,
    value,
    defaultValue,
    onChange,
    onReject,
    browseLabel = fileUploadDefaults.browseLabel,
    isDisabled = fileUploadDefaults.isDisabled,
    className,
  },
  ref,
) {
  const id = useId();
  const [inner, setInner] = useState<readonly File[]>(defaultValue ?? []);
  const files = value ?? inner;
  const [rejected, setRejected] = useState<{ file: File; reason: Reason }[]>([]);
  const [notice, setNotice] = useState("");

  const commit = (next: File[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const reasonText = (reason: Reason) =>
    reason === "type" ? "file type not allowed" : reason === "size" ? `larger than ${formatBytes(maxSize ?? 0)}` : `too many files (limit ${maxFiles})`;

  const addFiles = (incoming: File[]) => {
    if (isDisabled || incoming.length === 0) return;
    const refusals: { file: File; reason: Reason }[] = [];
    let next = multiple ? [...files] : [];
    let added = 0;
    for (const file of incoming) {
      if (!matchesAccept(file, accept)) refusals.push({ file, reason: "type" });
      else if (maxSize !== undefined && file.size > maxSize) refusals.push({ file, reason: "size" });
      else if (next.some((f) => same(f, file))) continue; // the same file again: nothing to add
      else if (multiple && maxFiles !== undefined && next.length >= maxFiles) refusals.push({ file, reason: "count" });
      else {
        next = multiple ? [...next, file] : [file];
        added++;
      }
    }
    setRejected(refusals);
    if (added) commit(next);
    onReject?.(refusals);
    const said: string[] = [];
    if (added) said.push(`${added} ${added === 1 ? "file" : "files"} added`);
    for (const r of refusals) said.push(`${r.file.name} not added: ${reasonText(r.reason)}`);
    setNotice(said.join(". "));
  };

  const remove = (file: File) => {
    commit(files.filter((f) => f !== file));
    setRejected([]);
    setNotice(`${file.name} removed`);
  };

  const describedBy = [description && `${id}-d`, rejected.length > 0 && `${id}-e`].filter(Boolean).join(" ") || undefined;

  return (
    <div ref={ref} role="group" aria-labelledby={`${id}-l`} aria-describedby={describedBy} className={cx("flex flex-col gap-2", className)}>
      <span id={`${id}-l`} className="text-sm font-medium text-[var(--rd-color-text-default)]">
        {label}
      </span>
      <DropZone
        isDisabled={isDisabled}
        onDrop={async (e) => {
          const dropped = await Promise.all(e.items.flatMap((item) => (item.kind === "file" ? [item.getFile()] : [])));
          addFiles(dropped);
        }}
        className={
          "group flex flex-col items-center gap-3 rounded-[var(--rd-radius-overlay)] border border-dashed border-[var(--rd-color-border-strong)] [box-shadow:var(--rd-elevation-raised)] " +
          "bg-[var(--rd-color-surface-subtle)]/50 px-6 py-8 text-center outline-none transition-[background-color,border-color,box-shadow] duration-150 " +
          "data-[hovered]:bg-[var(--rd-color-surface-subtle)] " +
          "data-[drop-target]:border-[var(--rd-color-action-primary)] data-[drop-target]:bg-[var(--rd-color-surface-selected)] data-[drop-target]:ring-4 " +
          "data-[drop-target]:ring-[color-mix(in_srgb,var(--rd-color-action-primary)_18%,transparent)] " +
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
        }
      >
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-full bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-muted)] ring-1 ring-[var(--rd-color-border-default)] [box-shadow:var(--rd-elevation-raised)] transition-transform duration-150 group-data-[drop-target]:-translate-y-0.5 group-data-[drop-target]:text-[var(--rd-color-action-primary)] motion-reduce:transition-none"
        >
          <UploadIcon className="size-5" />
        </span>
        <div className="flex flex-col items-center gap-1">
          <Text slot="label" className="text-sm text-[var(--rd-color-text-default)]">
            <span className="group-data-[drop-target]:hidden [@media(pointer:coarse)]:hidden">Drag files here, or</span>
            <span className="hidden [@media(pointer:coarse)]:inline group-data-[drop-target]:hidden">Add files from your device</span>
            <span className="hidden group-data-[drop-target]:inline">Drop to add</span>
          </Text>
          <FileTrigger
            acceptedFileTypes={accept ? [...accept] : undefined}
            allowsMultiple={multiple}
            onSelect={(list) => addFiles(list ? Array.from(list) : [])}
          >
            <Button variant="secondary" size="sm" isDisabled={isDisabled}>
              {browseLabel}
            </Button>
          </FileTrigger>
        </div>
      </DropZone>
      {description && (
        <p id={`${id}-d`} className="text-xs text-[var(--rd-color-text-muted)]">
          {description}
        </p>
      )}
      {rejected.length > 0 && (
        <ul id={`${id}-e`} className="flex flex-col gap-0.5 text-xs text-[var(--rd-color-feedback-danger)]">
          {rejected.map((r, i) => (
            <li key={`${r.file.name}-${i}`}>
              {r.file.name} not added: {reasonText(r.reason)}
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul aria-label={`${label}, chosen files`} className="flex flex-col gap-1.5">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="flex items-center gap-3 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] py-2 ps-3 pe-2 text-sm [box-shadow:var(--rd-elevation-raised)]"
            >
              <FileIcon className="size-5 shrink-0 text-[var(--rd-color-text-muted)]" />
              <span className="min-w-0 flex-1 truncate text-[var(--rd-color-text-default)]">{file.name}</span>
              <span className="shrink-0 tabular-nums text-xs text-[var(--rd-color-text-muted)]">{formatBytes(file.size)}</span>
              <AriaButton
                aria-label={`Remove ${file.name}`}
                isDisabled={isDisabled}
                onPress={() => remove(file)}
                className={
                  "flex size-7 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-muted)] outline-none " +
                  "data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] " +
                  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[disabled]:opacity-50"
                }
              >
                <CloseIcon className="size-4" />
              </AriaButton>
            </li>
          ))}
        </ul>
      )}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {notice}
      </div>
    </div>
  );
});
