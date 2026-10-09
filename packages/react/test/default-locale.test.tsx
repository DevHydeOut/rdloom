import fs from "node:fs";
import path from "node:path";
import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Bubble } from "../src/bubble/bubble";
import { Chart } from "../src/chart/chart";
import { compact, exactNumber } from "../src/chart/scales";
import { Stat } from "../src/stat/stat";
import { tidySegment } from "../src/utils/field";
import { plainSpaces, useDefaultLocale } from "../src/utils/use-default-locale";

// Server HTML and the first client render must read the same whatever the host's locale or time
// zone is, or React reports a hydration mismatch. Components format with one SSR-safe locale.

function srcRoot(): string {
  for (let dir = process.cwd(); ; dir = path.dirname(dir)) {
    for (const candidate of [dir, path.join(dir, "packages", "react")]) {
      if (fs.existsSync(path.join(candidate, "src", "utils", "icons.tsx"))) return path.join(candidate, "src");
    }
    if (dir === path.dirname(dir)) throw new Error("packages/react not found");
  }
}

function sources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "generated") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sources(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Places that are provably server-only or client-only (none today).
const allowed = new Set<string>([]);

describe("no formatting with the host's default locale", () => {
  const bad = /\b(toLocale(?:String|DateString|TimeString)|Intl\.(?:NumberFormat|DateTimeFormat))\(\s*(\)|undefined\b|\[\s*\])/;

  it("passes an explicit locale to every toLocale*String and Intl formatter call", () => {
    const root = srcRoot();
    const hits: string[] = [];
    for (const file of sources(root)) {
      const rel = path.relative(root, file).split(path.sep).join("/");
      if (allowed.has(rel)) continue;
      fs.readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (bad.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(hits).toEqual([]);
  });
});

describe("useDefaultLocale", () => {
  function Probe({ locale }: { locale?: string }) {
    return <span>{useDefaultLocale(locale)}</span>;
  }

  it("is en-US while rendering on the server", () => {
    expect(renderToString(<Probe />)).toContain("en-US");
  });

  it("lets an explicit locale win", () => {
    expect(renderToString(<Probe locale="de-DE" />)).toContain("de-DE");
  });
});

describe("number formatting", () => {
  it("takes the locale it is given", () => {
    expect(compact(20000, "en-US")).toBe("20K");
    expect(exactNumber(1234.5, "de-DE")).toBe("1.234,5");
  });

  it("Chart axis text does not depend on the host", () => {
    const data = { labels: ["a", "b"], series: [{ name: "Sales", values: [20000, 40000] }] };
    const html = renderToString(<Chart data={data} title="Sales" />);
    expect(html).toContain("20K");
  });

  it("Stat groups digits the same everywhere", () => {
    expect(renderToString(<Stat label="Users" value={12345} />)).toContain("12,345");
  });
});

describe("Bubble time", () => {
  it("leaves the time out of the server HTML and shows it after mount", () => {
    const stamp = new Date("2026-05-01T10:30:00Z");
    const html = renderToString(<Bubble timestamp={stamp}>Hello</Bubble>);
    expect(html).toContain("></time>");
    const { container } = render(<Bubble timestamp={stamp}>Hello</Bubble>);
    expect(container.querySelector("time")?.textContent).toMatch(/\d\d:\d\d/);
    expect(screen.getByText("Hello")).toBeTruthy();
  });

  it("shows timestampText as given, on the server too", () => {
    expect(renderToString(<Bubble timestamp="2026-05-01T10:30:00Z" timestampText="Just now">Hi</Bubble>)).toContain("Just now");
  });
});

describe("space normalising", () => {
  it("turns narrow and thin spaces into a normal space", () => {
    expect(plainSpaces("10:30\u202FAM")).toBe("10:30 AM");
    expect(tidySegment({ type: "literal", text: "\u2009\u2013\u2009" }).text).toBe(" \u2013 ");
    const seg = { text: "AM" };
    expect(tidySegment(seg)).toBe(seg);
  });
});
