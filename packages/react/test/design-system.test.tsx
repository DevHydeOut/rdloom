import fs from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as icons from "../src/utils/icons";

// The look of the library is a small set of shared decisions: one icon family, four elevation
// levels, three control sizes with a compact mode. These tests keep components from drifting
// back to one-off values.

function packageRoot(): string {
  for (let dir = process.cwd(); ; dir = path.dirname(dir)) {
    for (const candidate of [dir, path.join(dir, "packages", "react")]) {
      if (fs.existsSync(path.join(candidate, "src", "utils", "icons.tsx"))) return candidate;
    }
    if (dir === path.dirname(dir)) throw new Error("packages/react not found above " + process.cwd());
  }
}
const root = packageRoot();
const repo = path.resolve(root, "..", "..");
const css = fs.readFileSync(path.join(repo, "packages", "tokens", "dist", "tokens.css"), "utf8");

function componentFiles(): string[] {
  const out: string[] = [];
  for (const dir of fs.readdirSync(path.join(root, "src"))) {
    if (["generated", "motion", "utils"].includes(dir)) continue;
    const full = path.join(root, "src", dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full)) if (f.endsWith(".tsx")) out.push(path.join(full, f));
  }
  return out;
}

describe("icons", () => {
  const all = Object.entries(icons).filter(([name]) => /Icon$|^Spinner$/.test(name));

  it("has a real set to check", () => {
    expect(all.length).toBeGreaterThanOrEqual(25);
  });

  it.each(all)("%s is decorative and drawn on the shared 16-unit grid", (_, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("viewBox", "0 0 16 16");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  it("draws every line at one width unless told otherwise, and the width doesn't scale with the icon", () => {
    for (const [name, Icon] of all) {
      if (["DotsIcon", "GripIcon", "StopIcon"].includes(name)) continue; // solid marks
      const { container, unmount } = render(<Icon />);
      const widths = new Set<string>();
      container.querySelectorAll("[stroke-width]").forEach((el) => widths.add(el.getAttribute("stroke-width")!));
      expect([...widths].every((w) => ["1.5", "1.75"].includes(w)), `${name} uses ${[...widths].join(", ")}`).toBe(true);
      container.querySelectorAll("path, circle, rect").forEach((el) => expect(el.getAttribute("vector-effect"), name).toBe("non-scaling-stroke"));
      unmount();
    }
  });

  it("lets a small mark use a heavier line", () => {
    const { container } = render(<icons.CheckIcon strokeWidth={2} />);
    expect(container.querySelector("g")).toHaveAttribute("stroke-width", "2");
  });

  it("keeps the four status tones as four different shapes", () => {
    const shape = (Icon: () => React.ReactElement) => render(<Icon />).container.innerHTML;
    const shapes = new Set([shape(icons.InfoIcon), shape(icons.SuccessIcon), shape(icons.WarningIcon), shape(icons.ErrorIcon)]);
    expect(shapes.size).toBe(4);
  });

  it("is the only place icons are drawn: components import them, they don't draw their own", () => {
    // charts draw their own marks: these are data graphics, not icons
    const allowed = new Set(["generated-chart.tsx", "arrow.tsx", "chart.tsx", "sparkline.tsx", "stat.tsx"]);
    for (const file of componentFiles()) {
      if (allowed.has(path.basename(file))) continue;
      expect(fs.readFileSync(file, "utf8"), `${path.relative(root, file)} draws an inline <svg>`).not.toMatch(/<svg\b/);
    }
  });
});

describe("elevation", () => {
  const levels = ["control", "raised", "floating", "overlay"];

  it("defines four levels in light, and again for dark", () => {
    const light = css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)"));
    const dark = css.slice(css.indexOf(':root[data-theme="dark"]'), css.indexOf('[data-density="compact"]'));
    for (const level of levels) {
      expect(light).toContain(`--rd-elevation-${level}:`);
      expect(dark).toContain(`--rd-elevation-${level}:`);
    }
  });

  it("gives dark mode its own shadows: a dark drop alone would not show", () => {
    const get = (block: string, level: string) => block.match(new RegExp(`--rd-elevation-${level}: ([^;]+);`))![1];
    const light = css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)"));
    const dark = css.slice(css.indexOf(':root[data-theme="dark"]'), css.indexOf('[data-density="compact"]'));
    for (const level of levels) expect(get(dark, level)).not.toBe(get(light, level));
    expect(get(dark, "floating")).toContain("255 255 255");
  });

  it("is used through the tokens: no one-off shadows in components", () => {
    const stock = /(?<![\w-])shadow-(sm|md|lg|xl|2xl|inner)\b|shadow-\[(?!var)/;
    for (const file of componentFiles()) {
      const text = fs.readFileSync(file, "utf8");
      const m = text.match(stock);
      expect(m, `${path.relative(root, file)} uses a one-off shadow (${m?.[0]}); use an --rd-elevation token`).toBeNull();
    }
  });

  it("applies elevation in the form that works in Tailwind 3 and 4", () => {
    for (const file of componentFiles()) {
      expect(fs.readFileSync(file, "utf8"), path.relative(root, file)).not.toMatch(/shadow-\[var\(--rd-elevation/);
    }
  });
});

describe("density", () => {
  it("has three control sizes, and a compact mode that tightens each of them", () => {
    const base = css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)"));
    const compact = css.slice(css.indexOf('[data-density="compact"]'));
    const px = (block: string, name: string) => Number(block.match(new RegExp(`--rd-size-control-${name}: (\\d+)px`))![1]);
    for (const size of ["sm", "md", "lg"]) expect(px(compact, size)).toBeLessThan(px(base, size));
    expect(compact).toContain("--rd-space-control-x:");
  });

  it("is applied to controls through the tokens, not fixed heights", () => {
    for (const name of ["button", "text-field", "select", "number-field"]) {
      const text = fs.readFileSync(path.join(root, "src", name, `${name}.tsx`), "utf8");
      expect(text, `${name} should size from --rd-size-control-*`).toMatch(/--rd-size-control-(sm|md|lg)/);
    }
  });
});

describe("fonts", () => {
  it("components never set a font: they use the font of the app they are in", () => {
    for (const file of [...componentFiles(), path.join(root, "src", "utils", "field.ts")]) {
      const text = fs.readFileSync(file, "utf8");
      expect(text, path.relative(root, file)).not.toMatch(/font-(sans|serif)\b|font-family:(?!inherit)/);
    }
    expect(css).not.toMatch(/font-family|--rd-font/);
  });
});
