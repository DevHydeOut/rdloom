import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, BreadcrumbItem, Breadcrumbs, Checkbox, Pagination, Radio, RadioGroup, Rating, Sheet, Switch, TagInput, Button, DialogTrigger } from "../src";
import { touchHeight, touchHitArea, touchTarget } from "../src/utils/touch";

// Touch density: data-density="touch" (or "auto" on a phone or tablet) gives controls and tap targets the
// size of a finger. The size is a token that is 0 by default, so nothing changes until a page opts in.

function packageRoot(): string {
  for (let dir = process.cwd(); ; dir = path.dirname(dir)) {
    for (const candidate of [dir, path.join(dir, "packages", "react")]) {
      if (fs.existsSync(path.join(candidate, "src", "utils", "icons.tsx"))) return candidate;
    }
    if (dir === path.dirname(dir)) throw new Error("packages/react not found above " + process.cwd());
  }
}
const root = packageRoot();
const css = fs.readFileSync(path.join(root, "..", "tokens", "dist", "tokens.css"), "utf8");
const block = (selector: string) => {
  const start = css.indexOf(selector);
  expect(start, `${selector} is in the tokens`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("}", start));
};
const px = (text: string, name: string) => Number(text.match(new RegExp(`--rd-size-${name}: (\\d+)px`))![1]);

describe("the touch tokens", () => {
  const base = css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)"));

  it("do nothing by default: the tap target size is 0", () => {
    expect(px(base, "touch-target")).toBe(0);
  });

  it("make every control at least 44px under data-density=touch", () => {
    const touch = block('[data-density="touch"]');
    for (const size of ["sm", "md", "lg"]) {
      expect(px(touch, `control-${size}`)).toBeGreaterThanOrEqual(44);
      expect(px(touch, `control-${size}`)).toBeGreaterThan(px(base, `control-${size}`));
    }
    expect(px(touch, "touch-target")).toBe(44);
  });

  it("keep the three sizes in order", () => {
    const touch = block('[data-density="touch"]');
    expect(px(touch, "control-sm")).toBeLessThan(px(touch, "control-md"));
    expect(px(touch, "control-md")).toBeLessThan(px(touch, "control-lg"));
  });

  it("apply with data-density=auto only where the main pointer is coarse", () => {
    const media = css.indexOf("@media (pointer: coarse)");
    expect(media).toBeGreaterThan(-1);
    const auto = css.indexOf('[data-density="auto"]');
    expect(auto).toBeGreaterThan(media);
    expect(css.slice(media, css.indexOf("\n}\n", auto) + 3)).toContain("--rd-size-touch-target: 44px");
    // Nothing outside that query sets auto.
    expect(css.indexOf('[data-density="auto"]', auto + 1)).toBe(-1);
  });

  it("leave compact density without a tap target, so the two modes never fight", () => {
    expect(block('[data-density="compact"]')).not.toContain("touch-target");
  });
});

describe("the touch helpers", () => {
  it("read the token in both directions, in height only, and as a bigger hit area", () => {
    expect(touchTarget).toContain("min-h-[var(--rd-size-touch-target)]");
    expect(touchTarget).toContain("min-w-[var(--rd-size-touch-target)]");
    expect(touchHeight).toBe("min-h-[var(--rd-size-touch-target)]");
    expect(touchHitArea).toContain("after:");
    expect(touchHitArea).toContain("var(--rd-size-touch-target)");
  });
});

describe("components with small targets", () => {
  it("read the tap target token", () => {
    // These are small on purpose by default (a checkbox, a close button) and must reach a finger under touch density.
    for (const file of ["checkbox/checkbox", "switch/switch", "radio-group/radio-group", "rating/rating", "breadcrumbs/breadcrumbs", "pagination/pagination", "calendar/calendar", "sheet/sheet", "toast/toast", "alert/alert", "tag-input/tag-input", "menu/menu"]) {
      const text = fs.readFileSync(path.join(root, "src", `${file}.tsx`), "utf8");
      expect(text, `${file} should use the tap target size`).toMatch(/touchTarget|touchHitArea|touchHeight|--rd-size-touch-target/);
    }
  });

  it("never put two min-width or min-height utilities on one element, because the stylesheet decides which wins", () => {
    for (const file of ["pagination/pagination", "menu/menu"]) {
      const text = fs.readFileSync(path.join(root, "src", `${file}.tsx`), "utf8");
      for (const line of text.split("\n").filter((l) => l.includes("--rd-size-touch-target"))) {
        expect(line.match(/min-h-/g)?.length ?? 0, `${file}: ${line.trim().slice(0, 90)}`).toBeLessThanOrEqual(1);
        expect(line.match(/min-w-/g)?.length ?? 0, `${file}: ${line.trim().slice(0, 90)}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("give a checkbox, a switch and a radio a tap area of the token size", () => {
    render(
      <>
        <Checkbox>Agree</Checkbox>
        <Switch>Alerts</Switch>
        <RadioGroup label="Plan" defaultValue="a">
          <Radio value="a">A</Radio>
        </RadioGroup>
      </>,
    );
    for (const control of [screen.getByRole("checkbox"), screen.getByRole("switch"), screen.getByRole("radio")]) {
      expect(control.closest("label")?.className).toContain("min-h-[var(--rd-size-touch-target)]");
      expect(control.closest("label")?.className).toContain("min-w-[var(--rd-size-touch-target)]");
    }
  });

  it("give a rating star a tap area of the token size", () => {
    const { container } = render(<Rating label="Quality" />);
    expect(container.querySelector('[class*="min-h-[var(--rd-size-touch-target)]"]')).not.toBeNull();
  });

  it("give pagination buttons the larger of their size and the token", () => {
    render(<Pagination pageCount={5} />);
    const button = screen.getAllByRole("button")[1];
    expect(button.className).toContain("min-h-[max(");
    expect(button.className).toContain("min-w-[max(");
  });

  it("give breadcrumb links the larger of 24px and the token", () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem>Here</BreadcrumbItem>
      </Breadcrumbs>,
    );
    expect(screen.getByRole("link", { name: "Home" }).className).toContain("min-h-[max(1.5rem,var(--rd-size-touch-target))]");
  });

  it("give the dismiss button of an alert a tap area of the token size", () => {
    render(
      <Alert tone="info" title="Heads up" onDismiss={() => {}}>
        Body
      </Alert>,
    );
    const button = screen.getByRole("status").querySelector("button") as HTMLElement;
    expect(button.className).toContain("min-h-[var(--rd-size-touch-target)]");
  });

  it("give the close button of a sheet a tap area of the token size", async () => {
    render(
      <DialogTrigger isOpen>
        <Button>Open</Button>
        <Sheet title="Sheet">Content</Sheet>
      </DialogTrigger>,
    );
    expect((await screen.findByRole("button", { name: "Close" })).className).toContain("min-h-[var(--rd-size-touch-target)]");
  });

  it("grow the tap area of a tag's remove button without growing the tag", () => {
    render(<TagInput label="Tags" defaultValue={["one"]} />);
    const remove = document.querySelector<HTMLElement>("[slot=remove]") as HTMLElement;
    expect(remove.className).toContain("after:size-[max(100%,var(--rd-size-touch-target))]");
    expect(remove.className).not.toContain("min-h-[var(--rd-size-touch-target)]");
  });
});
