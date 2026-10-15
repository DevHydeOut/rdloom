import fs from "node:fs";
import path from "node:path";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BentoCard, BentoGrid, CodeComparison, Terminal } from "../src";
import { axeViolations } from "./axe";

const css = fs.readFileSync(path.join(__dirname, "..", "src", "motion", "rdloom-motion.css"), "utf8");

const mockMotion = (reduce: boolean) =>
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({ matches: reduce && query.includes("prefers-reduced-motion"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
  );

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("BentoGrid", () => {
  const grid = (
    <BentoGrid label="Features">
      <BentoCard colSpan={2} rowSpan={2} title="Fast" description="Quick setup" icon={<svg data-testid="icon" />} background={<i data-testid="bg" />} />
      <BentoCard title="Linked" href="/more" actionLabel="Read more" headingLevel={4} />
      <BentoCard title="Action" onAction={() => undefined} />
    </BentoGrid>
  );

  it("is a real list with a heading per card", () => {
    render(grid);
    const list = screen.getByRole("list", { name: "Features" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("heading", { level: 3, name: "Fast" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Linked" })).toBeInTheDocument();
  });

  it("applies spans and hides decoration", () => {
    render(grid);
    const first = screen.getAllByRole("listitem")[0];
    expect(first.className).toContain("md:col-span-2");
    expect(first.className).toContain("md:row-span-2");
    expect(screen.getByTestId("icon").closest("[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByTestId("bg").closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("gives a card one link or one button", () => {
    render(grid);
    expect(screen.getByRole("link", { name: "Read more" })).toHaveAttribute("href", "/more");
    expect(screen.getByRole("button", { name: "Learn more" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("honours reduced motion and still", () => {
    render(<BentoGrid isStill label="x"><BentoCard title="A" /></BentoGrid>);
    expect(screen.getByRole("list")).toHaveAttribute("data-rdm-still");
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*\.rdm-bento-card \{\s*transition: none/);
    expect(css).toContain(".rdm-still .rdm-bento-card");
    expect(css).toContain(".rdm-bento[data-rdm-still] .rdm-bento-card");
    expect(css).toContain("@media (hover: hover)");
  });

  it("renders in server HTML", () => {
    const html = renderToString(grid);
    expect(html).toContain("<ul");
    expect(html).toContain("Quick setup");
  });

  it("has no axe violations", async () => {
    const { container } = render(grid);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Terminal", () => {
  const lines = [{ text: "npm install" }, { text: "Done", kind: "output" as const }, { text: "npm test" }];

  beforeEach(() => mockMotion(false));

  it("is a named group with all text in server HTML", () => {
    const html = renderToString(<Terminal lines={lines} />);
    expect(html).toContain('role="group"');
    expect(html).toContain("npm install");
    expect(html).toContain("Done");
    expect(html).toContain("npm test");
  });

  it("types the lines once and ends with every line shown", () => {
    vi.useFakeTimers();
    render(<Terminal lines={lines} speed={10} lineDelay={20} />);
    const group = screen.getByRole("group", { name: "Terminal" });
    // Typing starts: the first line is partly typed, later lines are not there yet, the full text is for screen readers.
    expect(group.textContent).not.toContain("npm test");
    expect(group.querySelector(".sr-only")?.textContent).toBe("npm install");
    for (let i = 0; i < 200; i++) act(() => void vi.advanceTimersByTime(10));
    expect(group.querySelector("pre")?.textContent).toBe("$npm installDone$npm test");
    expect(group.querySelector(".rdm-caret")).toBeNull();
    for (let i = 0; i < 50; i++) act(() => void vi.advanceTimersByTime(10));
    expect(group.querySelector("pre")?.textContent).toBe("$npm installDone$npm test");
  });

  it("shows everything at once for reduced motion", () => {
    mockMotion(true);
    vi.useFakeTimers();
    render(<Terminal lines={lines} />);
    expect(screen.getByRole("group").querySelector("pre")?.textContent).toContain("npm test");
    expect(screen.getByRole("group").querySelector(".rdm-caret")).toBeNull();
  });

  it("isPaused is still mode", () => {
    render(<Terminal isPaused lines={lines} />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-rdm-paused");
    expect(group.querySelector("pre")?.textContent).toContain("npm test");
  });

  it("copies only the commands and confirms politely", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Terminal isPaused lines={lines} />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("npm install\nnpm test");
    expect(await screen.findByRole("status")).toHaveTextContent("Copied");
  });

  it("can hide the copy button", () => {
    render(<Terminal isPaused showCopy={false} lines={lines} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has no axe violations while typing and when finished", async () => {
    const { container } = render(<Terminal lines={lines} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("CodeComparison", () => {
  const props = { before: "a = 1\nb = 2", after: "a = 1\nb = 3\nc = 4" };

  it("renders both panels with labels and real code", () => {
    render(<CodeComparison {...props} />);
    const group = screen.getByRole("group", { name: "Code comparison" });
    expect(within(group).getAllByRole("figure")).toHaveLength(2);
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
    expect(group.querySelectorAll("pre code")).toHaveLength(2);
    expect(group.textContent).toContain("c = 4");
  });

  it("stacks on phones and goes side by side from md", () => {
    render(<CodeComparison {...props} />);
    const cls = screen.getByRole("group").className;
    expect(cls).toContain("grid-cols-1");
    expect(cls).toContain("md:grid-cols-2");
  });

  it("marks highlighted lines and names them in text", () => {
    render(<CodeComparison {...props} afterHighlight={[2, 3]} beforeLabel="Old" afterLabel="New" />);
    expect(document.querySelectorAll("[data-highlighted]")).toHaveLength(2);
    expect(screen.getByText(/Highlighted lines: 2, 3/)).toBeInTheDocument();
  });

  it("renders in server HTML", () => {
    expect(renderToString(<CodeComparison {...props} />)).toContain("c = 4");
  });

  it("has no axe violations", async () => {
    const { container } = render(<CodeComparison {...props} beforeHighlight={[1]} language="ts" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
