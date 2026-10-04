import { useState, type ReactNode } from "react";
import { Button } from "@rdloom/react";

export function CodeBlock({ code, label = "Code" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre
        tabIndex={0}
        aria-label={label}
        className="overflow-x-auto rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-subtle)] p-4 pe-20 text-[13px] leading-relaxed"
      >
        <code>{code.trimEnd()}</code>
      </pre>
      <div className="absolute end-2 top-2">
        <Button
          size="sm"
          variant="ghost"
          aria-label={copied ? "Copied" : `Copy ${label.toLowerCase()}`}
          onPress={async () => {
            await navigator.clipboard?.writeText(code.trimEnd());
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

export function PageTitle({ children, lead }: { children: ReactNode; lead?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 pb-8">
      {/* Focused on navigation, so screen readers announce the new page. */}
      <h1 id="page-title" tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none">
        {children}
      </h1>
      {lead && <p className="max-w-2xl text-lg text-[var(--site-muted)]">{lead}</p>}
    </div>
  );
}

export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 pt-10 pb-3 text-xl font-semibold">
      {children}
    </h2>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="flex max-w-3xl flex-col gap-4 leading-relaxed [&_a]:underline [&_code]:text-[0.9em]">{children}</div>;
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--site-border)] px-2 py-0.5 text-xs text-[var(--site-muted)]">
      {children}
    </span>
  );
}

export function List({ items, tone }: { items: string[]; tone?: "do" | "dont" }) {
  const mark = tone === "do" ? "✓" : tone === "dont" ? "✕" : "•";
  const color = tone === "do" ? "text-[var(--rd-color-feedback-success)]" : tone === "dont" ? "text-[var(--rd-color-feedback-danger)]" : "";
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true" className={color}>
            {mark}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
