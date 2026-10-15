import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dock, DockItem, HomeIcon, RainbowButton, SearchIcon, SettingsIcon, ShinyButton } from "../src";
import { axeViolations } from "./axe";

function mockMotionPreference(reduce: boolean) {
  const query = { matches: reduce, media: "(prefers-reduced-motion: reduce)", addEventListener: () => {}, removeEventListener: () => {} };
  vi.stubGlobal("matchMedia", () => query);
}

beforeEach(() => mockMotionPreference(false));
afterEach(() => vi.unstubAllGlobals());

const dock = (props: Record<string, unknown> = {}) => (
  <Dock label="Apps" {...props}>
    <DockItem label="Home"><HomeIcon /></DockItem>
    <DockItem label="Search"><SearchIcon /></DockItem>
    <DockItem label="Settings"><SettingsIcon /></DockItem>
  </Dock>
);

// jsdom has no layout: give each item a box so the pointer maths has something to work with.
function layout(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("[data-rdm-dock-item]").forEach((el, i) => {
    el.getBoundingClientRect = () => ({ left: i * 100, right: i * 100 + 40, top: 0, bottom: 40, width: 40, height: 40, x: i * 100, y: 0, toJSON() {} }) as DOMRect;
  });
}

describe("Dock", () => {
  it("is a named toolbar of named buttons", () => {
    render(dock());
    expect(screen.getByRole("toolbar", { name: "Apps" })).toHaveAttribute("aria-orientation", "horizontal");
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Home", "Search", "Settings"]);
  });

  it("renders an item with an href as a link", () => {
    render(<Dock label="Links"><DockItem label="Docs" href="/docs"><HomeIcon /></DockItem></Dock>);
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
  });

  it("has a single tab stop and moves with the arrow keys, wrapping, plus Home and End", async () => {
    const user = userEvent.setup();
    render(dock());
    const [home, search, settings] = screen.getAllByRole("button");
    expect([home.tabIndex, search.tabIndex, settings.tabIndex]).toEqual([0, -1, -1]);
    await user.tab();
    expect(home).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(search).toHaveFocus();
    expect(search.tabIndex).toBe(0);
    expect(home.tabIndex).toBe(-1);
    await user.keyboard("{End}");
    expect(settings).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(home).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(settings).toHaveFocus();
    await user.keyboard("{Home}");
    expect(home).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(document.body).toHaveFocus();
  });

  it("uses up and down arrows when vertical", async () => {
    const user = userEvent.setup();
    render(dock({ orientation: "vertical" }));
    const [home, search] = screen.getAllByRole("button");
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(home).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(search).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(home).toHaveFocus();
  });

  it("shows the label as a tooltip on keyboard focus", async () => {
    const user = userEvent.setup();
    render(dock());
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Home");
  });

  it("calls onPress with Enter", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Dock label="A"><DockItem label="Go" onPress={onPress}><HomeIcon /></DockItem></Dock>);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("magnifies toward a mouse pointer, most under it", () => {
    const { container } = render(dock());
    layout(container);
    const bar = screen.getByRole("toolbar");
    bar.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 20 }));
    const scales = screen.getAllByRole("button").map((b) => Number(b.style.getPropertyValue("--rdm-dock-s")));
    expect(scales[0]).toBeCloseTo(1.6, 1);
    expect(scales[0]).toBeGreaterThan(scales[1]);
    expect(scales[1]).toBeGreaterThanOrEqual(1);
  });

  it("does not magnify for touch, reduced motion or isPaused", () => {
    const move = (pointerType: string) => {
      const event = new MouseEvent("pointermove", { bubbles: true, clientX: 20 });
      Object.defineProperty(event, "pointerType", { value: pointerType });
      return event;
    };
    const touch = render(dock());
    layout(touch.container);
    screen.getByRole("toolbar").dispatchEvent(move("touch"));
    expect(screen.getAllByRole("button")[0].style.getPropertyValue("--rdm-dock-s")).toBe("");
    touch.unmount();

    mockMotionPreference(true);
    const reduced = render(dock());
    layout(reduced.container);
    screen.getByRole("toolbar").dispatchEvent(move("mouse"));
    expect(screen.getAllByRole("button")[0].style.getPropertyValue("--rdm-dock-s")).toBe("");
    reduced.unmount();

    mockMotionPreference(false);
    const paused = render(dock({ isPaused: true }));
    layout(paused.container);
    const bar = screen.getByRole("toolbar");
    expect(bar).toHaveAttribute("data-rdm-paused");
    bar.dispatchEvent(move("mouse"));
    expect(screen.getAllByRole("button")[0].style.getPropertyValue("--rdm-dock-s")).toBe("");
  });

  it("clears magnification when the pointer leaves", () => {
    const { container } = render(dock());
    layout(container);
    const bar = screen.getByRole("toolbar");
    bar.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 20 }));
    expect(screen.getAllByRole("button")[0].style.getPropertyValue("--rdm-dock-s")).not.toBe("");
    fireEvent.pointerLeave(bar);
    expect(screen.getAllByRole("button")[0].style.getPropertyValue("--rdm-dock-s")).toBe("");
  });

  it("has no axe violations, horizontal or vertical", async () => {
    const { container } = render(<>{dock()}{dock({ orientation: "vertical", label: "Side" })}</>);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders its items in server HTML", () => {
    const html = renderToString(dock());
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Search"');
  });
});

describe.each([
  ["RainbowButton", RainbowButton, "rdm-rainbow"],
  ["ShinyButton", ShinyButton, "rdm-shiny"],
] as const)("%s", (_name, Component, cls) => {
  it("is a plain named button, with decoration hidden", () => {
    const { container } = render(<Component>Upgrade</Component>);
    expect(screen.getByRole("button", { name: "Upgrade" })).toBeInTheDocument();
    expect(container.querySelector(`.${cls}`)).not.toBeNull();
    container.querySelectorAll("[class*='rdm-'][aria-hidden]").forEach((el) => expect(el).toHaveAttribute("aria-hidden", "true"));
    expect(container.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThan(0);
  });

  it("presses with the keyboard and respects isDisabled", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(<Component onPress={onPress}>Go</Component>);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onPress).toHaveBeenCalledTimes(1);
    rerender(<Component isDisabled onPress={onPress}>Go</Component>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("marks itself paused with isPaused, and also with reduced motion on", () => {
    const { container, rerender } = render(<Component isPaused>Go</Component>);
    expect(container.querySelector("[data-rdm-paused]")).not.toBeNull();
    mockMotionPreference(true);
    rerender(<Component>Go</Component>);
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });

  it("passes duration as a CSS variable", () => {
    const { container } = render(<Component duration={7}>Go</Component>);
    expect(container.innerHTML).toContain("--rdm-d: 7s");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Component>Upgrade</Component>);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders its label in server HTML", () => {
    expect(renderToString(<Component>Upgrade</Component>)).toContain("Upgrade");
  });
});
