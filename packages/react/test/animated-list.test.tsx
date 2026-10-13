import fs from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimatedList } from "../src";
import { axeViolations } from "./axe";

const css = fs.readFileSync(path.join(__dirname, "..", "src", "motion", "rdloom-motion.css"), "utf8");

afterEach(() => vi.unstubAllGlobals());

const items = (labels: string[]) => labels.map((l) => <span key={l}>{l}</span>);

describe("AnimatedList", () => {
  it("is a real list with one item per child", () => {
    render(<AnimatedList aria-label="Steps">{items(["One", "Two", "Three"])}</AnimatedList>);
    const list = screen.getByRole("list", { name: "Steps" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("staggers the first batch by delay", () => {
    render(<AnimatedList delay={0.2} aria-label="Steps">{items(["One", "Two", "Three"])}</AnimatedList>);
    const delays = screen.getAllByRole("listitem").map((li) => li.style.getPropertyValue("--rdm-delay"));
    expect(delays).toEqual(["0s", "0.2s", "0.4s"]);
  });

  it("gives items added later their own stagger and leaves existing ones alone", () => {
    const { rerender } = render(<AnimatedList delay={0.2} aria-label="Steps">{items(["One", "Two"])}</AnimatedList>);
    rerender(<AnimatedList delay={0.2} aria-label="Steps">{items(["One", "Two", "Three", "Four"])}</AnimatedList>);
    const delays = screen.getAllByRole("listitem").map((li) => li.style.getPropertyValue("--rdm-delay"));
    expect(delays).toEqual(["0s", "0.2s", "0s", "0.2s"]);
  });

  it("is a polite live region only when asked", () => {
    const { rerender } = render(<AnimatedList aria-label="Steps">{items(["One"])}</AnimatedList>);
    expect(screen.getByRole("list")).not.toHaveAttribute("aria-live");
    rerender(<AnimatedList announce aria-label="Steps">{items(["One"])}</AnimatedList>);
    expect(screen.getByRole("list")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("list")).toHaveAttribute("aria-relevant", "additions");
  });

  it("isStill marks the list and the stylesheet stops the animation for it, for reduced motion and for rdm-still", () => {
    render(<AnimatedList isStill aria-label="Steps">{items(["One"])}</AnimatedList>);
    expect(screen.getByRole("list")).toHaveAttribute("data-rdm-still");
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*\.rdm-list-item \{\s*animation: none/);
    expect(css).toContain(".rdm-still .rdm-list-item");
    expect(css).toContain(".rdm-list[data-rdm-still] .rdm-list-item");
  });

  it("renders every item in server HTML", () => {
    const html = renderToString(<AnimatedList>{items(["One", "Two"])}</AnimatedList>);
    expect(html).toContain("<ul");
    expect(html).toContain("One");
    expect(html).toContain("Two");
    expect(html.match(/<li/g)).toHaveLength(2);
  });

  it("has no axe violations", async () => {
    const { container } = render(<AnimatedList announce aria-label="Steps">{items(["One", "Two"])}</AnimatedList>);
    expect(await axeViolations(container)).toEqual([]);
  });
});
