"use client";

import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from "react";
import { Button } from "react-aria-components";
import { terminalDefaults, type TerminalSpecProps } from "../generated/terminal.types";
import { cx } from "../utils/cx";
import { CheckIcon, CopyIcon } from "../utils/icons";
import { prefersReducedMotion, useIsomorphicLayoutEffect, useReducedMotion } from "../utils/motion";

export interface TerminalProps
  extends TerminalSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof TerminalSpecProps | "className" | "children"> {
  className?: string;
}

interface Progress {
  line: number;
  chars: number;
}

/**
 * A command-line style panel. All lines are real text in the server HTML. After mount the commands
 * are typed once; while a line is typed its full text stays available to screen readers and the typed
 * copy is hidden. Reduced motion and isPaused show every line at once.
 */
export const Terminal = forwardRef<HTMLDivElement, TerminalProps>(function Terminal(
  {
    lines,
    label = terminalDefaults.label,
    prompt = terminalDefaults.prompt,
    speed = terminalDefaults.speed,
    lineDelay = terminalDefaults.lineDelay,
    showCopy = terminalDefaults.showCopy,
    copyLabel = terminalDefaults.copyLabel,
    copiedLabel = terminalDefaults.copiedLabel,
    isPaused = terminalDefaults.isPaused,
    className,
    ...rest
  },
  ref,
) {
  const reduced = useReducedMotion();
  const still = isPaused || reduced;
  // null means "show everything": the server render, no JavaScript, reduced motion and isPaused.
  const [progress, setProgress] = useState<Progress | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const signature = lines.map((l) => `${l.kind ?? "command"}:${l.text}`).join("\n");
  useIsomorphicLayoutEffect(() => {
    setProgress(still || prefersReducedMotion() ? null : { line: 0, chars: 0 });
  }, [still, signature]);

  useEffect(() => {
    if (!progress || progress.line >= lines.length) return;
    const current = lines[progress.line];
    const isCommand = (current.kind ?? "command") === "command";
    const typing = isCommand && progress.chars < Array.from(current.text).length;
    // Commands type one character at a time; a finished command and an output line wait, then move on.
    const timer = setTimeout(
      () => setProgress(typing ? { line: progress.line, chars: progress.chars + 1 } : { line: progress.line + 1, chars: 0 }),
      typing ? speed : lineDelay,
    );
    return () => clearTimeout(timer);
  }, [progress, lines, speed, lineDelay]);

  const copy = async () => {
    const text = lines
      .filter((l) => (l.kind ?? "command") === "command")
      .map((l) => l.text)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: nothing to confirm */
    }
  };

  return (
    <div
      {...rest}
      ref={ref}
      role="group"
      aria-label={label}
      data-rdm-paused={isPaused || undefined}
      className={cx(
        "rdm-terminal overflow-hidden rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] text-[var(--rd-color-text-default)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--rd-color-border-default)] ps-3 pe-1 text-xs text-[var(--rd-color-text-muted)]">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="size-2.5 rounded-full border border-[var(--rd-color-border-default)]" />
          <span className="size-2.5 rounded-full border border-[var(--rd-color-border-default)]" />
          <span className="size-2.5 rounded-full border border-[var(--rd-color-border-default)]" />
        </span>
        {showCopy ? (
          <Button
            onPress={copy}
            className="my-1 inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[hovered]:bg-[var(--rd-color-surface-selected)]"
          >
            {copied ? <CheckIcon className="size-4" /> : <CopyIcon />}
            <span>{copied ? copiedLabel : copyLabel}</span>
          </Button>
        ) : (
          <span />
        )}
      </div>
      {/* A long line scrolls inside the panel, so the text must be reachable without a mouse. */}
      <pre
        tabIndex={0}
        className="m-0 overflow-x-auto p-3 font-mono text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rd-color-focus-ring)]"
      >
        {lines.map((line, i) => {
          const isCommand = (line.kind ?? "command") === "command";
          if (progress && i > progress.line) return null;
          const active = progress !== null && i === progress.line;
          // An output line waits its turn, then shows whole.
          if (active && !isCommand) return null;
          return (
            <div key={i} className="rdm-terminal-line">
              {isCommand ? (
                <span aria-hidden="true" className="select-none pe-2 text-[var(--rd-color-text-muted)]">
                  {prompt}
                </span>
              ) : null}
              {active ? (
                <>
                  <span className="sr-only">{line.text}</span>
                  <span aria-hidden="true">
                    {Array.from(line.text).slice(0, progress.chars).join("")}
                    <span className="rdm-caret" />
                  </span>
                </>
              ) : (
                <span className={isCommand ? undefined : "text-[var(--rd-color-text-muted)]"}>{line.text}</span>
              )}
            </div>
          );
        })}
      </pre>
      <span role="status" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </div>
  );
});
