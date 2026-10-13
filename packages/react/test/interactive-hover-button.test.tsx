import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { InteractiveHoverButton } from "../src";
import { axeViolations } from "./axe";

const css = fs.readFileSync(path.join(__dirname, "..", "src", "motion", "rdloom-motion.css"), "utf8");

describe("InteractiveHoverButton", () => {
  it("is a button named by its main label, with the hover layer hidden", () => {
    render(<InteractiveHoverButton hoverLabel="Open">Open the docs</InteractiveHoverButton>);
    const button = screen.getByRole("button", { name: "Open the docs" });
    const hover = button.querySelector(".rdm-ihb-hover");
    expect(hover).toHaveAttribute("aria-hidden", "true");
    expect(hover).toHaveTextContent("Open");
  });

  it("presses with mouse and keyboard, and takes focus", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<InteractiveHoverButton onPress={onPress}>Go</InteractiveHoverButton>);
    await user.tab();
    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("data-focus-visible");
    await user.keyboard("{Enter}");
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("uses the same rule for hover and keyboard focus, gated for real pointers, and is still when disabled, reduced or in rdm-still", () => {
    expect(css).toMatch(/\.rdm-ihb\[data-focus-visible\]:not\(\[data-disabled\], \[data-pending\]\) \.rdm-ihb-hover/);
    expect(css).toMatch(/@media \(hover: hover\) \{\s*\.rdm-ihb\[data-hovered\]/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*\.rdm-ihb-hover \{\s*display: none/);
    expect(css).toContain(".rdm-still .rdm-ihb-hover");
  });

  it("renders the label in server HTML", () => {
    const html = renderToString(<InteractiveHoverButton hoverLabel="Open">Open the docs</InteractiveHoverButton>);
    expect(html).toContain("Open the docs");
    expect(html).toContain("<button");
  });

  it("has no axe violations", async () => {
    const { container } = render(<InteractiveHoverButton hoverLabel="Open">Open the docs</InteractiveHoverButton>);
    expect(await axeViolations(container)).toEqual([]);
  });
});
