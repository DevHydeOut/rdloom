"use client";

import { useEffect, useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { CheckIcon, CopyIcon } from "../utils/icons";

export interface CodeBlockProps {
  code: string;
  language?: string;
  /** True while the closing fence hasn't arrived yet (the reply is still streaming). */
  open?: boolean;
}

/** A code block with a copy button. Once copied, the button says so and a polite status repeats it. */
export function CodeBlock({ code, language, open = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: nothing to confirm */
    }
  };

  return (
    <figure className="my-3 overflow-hidden rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]">
      <figcaption className="flex items-center justify-between border-b border-[var(--rd-color-border-default)] ps-3 pe-1 text-xs text-[var(--rd-color-text-muted)]">
        <span>{language || "Code"}</span>
        <AriaButton
          onPress={copy}
          isDisabled={open}
          className="my-1 inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[hovered]:bg-[var(--rd-color-surface-selected)] data-[disabled]:opacity-50"
        >
          {copied ? <CheckIcon className="size-4" /> : <CopyIcon />}
          <span>{copied ? "Copied" : "Copy"}</span>
          <span className="sr-only">{language ? ` ${language} code` : " code"}</span>
        </AriaButton>
      </figcaption>
      {/* A long line scrolls inside the block, so the block must be reachable without a mouse. */}
      <pre tabIndex={0} className="overflow-x-auto p-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rd-color-focus-ring)]">
        <code className="font-mono">{code}</code>
      </pre>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </figure>
  );
}
