import { Fragment, type ReactNode } from "react";
import type { CitationPart } from "../utils/ai";
import { Citation } from "../citation/citation";
import { CodeBlock } from "./code-block";

// A small markdown reader for assistant replies: paragraphs, headings, lists, quotes, tables,
// code, emphasis, links. It builds React elements directly and never injects HTML, so text from a
// model can't add markup or scripts. Anything it doesn't know shows as plain text, and text that
// is cut off mid-way (while streaming) never throws: a half-open code block still shows as code.

export interface MarkdownOptions {
  /** Level of the first heading (`#`). Replies sit inside a page, so this is 3 by default. */
  headingStart: number;
  citations?: CitationPart[];
}

const SAFE_URL = /^(https?:|mailto:|\/|#|\.\.?\/)/i;
export const isSafeUrl = (url: string) => SAFE_URL.test(url.trim());
const isExternal = (url: string) => /^https?:/i.test(url.trim());

// --- Inline

// Groups: 1 code, 2-3 bold, 4-5 italic, 6 image, 7 link, 8 [n] source marker, 9 escaped character, 10 bare web address.
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*)|(__[^_\n]+?__)|(\*[^*\s][^*\n]*?\*)|(\b_[^_\s][^_\n]*?_\b)|(!\[[^\]\n]*\]\([^)\s]+\))|(\[[^\]\n]+\]\([^)\s]+\))|(\[\d{1,2}\])|(\\[\\`*_{}\[\]()#+.!>|-])|(https?:\/\/[^\s<>()]*[^\s<>().,;:!?'"])/g;

const linkClass = "font-medium underline underline-offset-2 hover:text-[var(--rd-color-action-primary)]";

/** A link: outside addresses open in a new tab and say so, and unsafe schemes are not links at all. */
function renderLink(url: string, label: ReactNode, key: string): ReactNode {
  if (!isSafeUrl(url)) return label;
  if (!isExternal(url)) {
    return (
      <a key={key} href={url} className={linkClass}>
        {label}
      </a>
    );
  }
  return (
    <a key={key} href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function renderInline(text: string, opts: MarkdownOptions, keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const index = m.index ?? 0;
    if (index > last) out.push(text.slice(last, index));
    const token = m[0];
    const key = `${keyPrefix}${n++}`;
    if (m[1]) {
      out.push(
        <code key={key} className="rounded bg-[var(--rd-color-surface-subtle)] px-1 py-0.5 font-mono text-[0.9em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (m[2] || m[3]) {
      out.push(<strong key={key}>{renderInline(token.slice(2, -2), opts, key)}</strong>);
    } else if (m[4] || m[5]) {
      out.push(<em key={key}>{renderInline(token.slice(1, -1), opts, key)}</em>);
    } else if (m[6]) {
      // Images are shown as a link, never loaded: an address chosen by a model could be used to track the reader.
      const close = token.indexOf("](");
      const alt = token.slice(2, close).trim();
      out.push(renderLink(token.slice(close + 2, -1), alt ? `${alt} (image)` : "Image", key));
    } else if (m[7]) {
      const close = token.indexOf("](");
      out.push(renderLink(token.slice(close + 2, -1), renderInline(token.slice(1, close), opts, key), key));
    } else if (m[8]) {
      const number = Number(token.slice(1, -1));
      const source = opts.citations?.[number - 1];
      out.push(source ? <Citation key={key} index={number} source={source} /> : token);
    } else if (m[9]) {
      out.push(token.slice(1));
    } else if (m[10]) {
      out.push(renderLink(token, token, key));
    }
    last = index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// --- Blocks

const FENCE = /^\s*(`{3,}|~{3,})\s*([\w+#.-]*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const indentOf = (line: string) => line.match(/^\s*/)![0].length;

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const startsBlock = (line: string) => FENCE.test(line) || HEADING.test(line) || RULE.test(line) || LIST_ITEM.test(line) || QUOTE.test(line);

export function renderBlocks(source: string, opts: MarkdownOptions, keyPrefix = "b"): ReactNode[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let n = 0;
  const key = () => `${keyPrefix}${n++}`;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }

    const fence = line.match(FENCE);
    if (fence) {
      const marker = fence[1];
      const body: string[] = [];
      i++;
      let closed = false;
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t.length >= marker.length && t === marker[0].repeat(t.length)) {
          closed = true;
          i++;
          break;
        }
        body.push(lines[i]);
        i++;
      }
      out.push(<CodeBlock key={key()} code={body.join("\n")} language={fence[2] || undefined} open={!closed} />);
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      const level = Math.min(6, opts.headingStart + heading[1].length - 1);
      const Tag = `h${level}` as "h3";
      out.push(
        <Tag key={key()} className="mt-4 mb-2 font-semibold first:mt-0">
          {renderInline(heading[2], opts)}
        </Tag>,
      );
      i++;
      continue;
    }

    if (RULE.test(line)) {
      out.push(<hr key={key()} className="my-4 border-[var(--rd-color-border-default)]" />);
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        body.push(lines[i].match(QUOTE)![1]);
        i++;
      }
      out.push(
        <blockquote key={key()} className="my-3 border-s-2 border-[var(--rd-color-border-strong)] ps-3 text-[var(--rd-color-text-muted)]">
          {renderBlocks(body.join("\n"), opts, key())}
        </blockquote>,
      );
      continue;
    }

    const item = line.match(LIST_ITEM);
    if (item) {
      const ordered = /\d/.test(item[2]);
      const baseIndent = item[1].length;
      const items: string[][] = [];
      while (i < lines.length) {
        const current = lines[i];
        const next = current.match(LIST_ITEM);
        if (next && next[1].length <= baseIndent && /\d/.test(next[2]) === ordered) {
          items.push([next[3]]);
          i++;
        } else if (current.trim() !== "" && items.length && indentOf(current) > baseIndent) {
          // A nested list or a continuation line belongs to the item above it.
          items[items.length - 1].push(current.slice(Math.min(indentOf(current), baseIndent + 2)));
          i++;
        } else if (current.trim() === "" && items.length && lines[i + 1] !== undefined && LIST_ITEM.test(lines[i + 1]) && indentOf(lines[i + 1]) >= baseIndent) {
          i++; // a blank line between items doesn't end the list
        } else break;
      }
      const Tag = ordered ? "ol" : "ul";
      const listKey = key();
      out.push(
        <Tag key={listKey} className={`my-3 flex flex-col gap-1 ps-6 ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((parts, index) => (
            <li key={index} className="ps-1">
              {renderBlocks(parts.join("\n"), opts, `${listKey}-${index}-`).map((node, k) => (
                <Fragment key={k}>{unwrapParagraph(node)}</Fragment>
              ))}
            </li>
          ))}
        </Tag>,
      );
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && TABLE_SEPARATOR.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const header = splitRow(line);
      const align = splitRow(lines[i + 1]).map((cell) => (cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : "left"));
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const alignClass = (c: number) => (align[c] === "right" ? "text-end" : align[c] === "center" ? "text-center" : "text-start");
      out.push(
        <div key={key()} className="my-3 overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]" tabIndex={0} role="region" aria-label="Table">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {header.map((cell, c) => (
                  <th key={c} scope="col" className={`border-b border-[var(--rd-color-border-strong)] px-3 py-2 font-semibold ${alignClass(c)}`}>
                    {renderInline(cell, opts)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {header.map((_, c) => (
                    <td key={c} className={`border-b border-[var(--rd-color-border-default)] px-3 py-2 ${alignClass(c)}`}>
                      {renderInline(row[c] ?? "", opts)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // A paragraph runs until a blank line or the start of another block. Single line breaks stay line breaks.
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !startsBlock(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(
      <p key={key()} className="my-3 first:mt-0 last:mb-0">
        {para.map((text, index) => (
          <Fragment key={index}>
            {index > 0 && <br />}
            {renderInline(text.trim(), opts, `p${index}-`)}
          </Fragment>
        ))}
      </p>,
    );
  }
  return out;
}

/** A list item's lone paragraph is just its text: no extra block spacing inside the bullet. */
function unwrapParagraph(node: ReactNode): ReactNode {
  if (node && typeof node === "object" && "type" in node && node.type === "p") {
    return (node as { props: { children: ReactNode } }).props.children;
  }
  return node;
}
