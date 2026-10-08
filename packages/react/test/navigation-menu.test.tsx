import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuTrigger } from "../src";
import { axeViolations } from "./axe";

function Menu() {
  return (
    <>
      <NavigationMenu label="Main" delay={0}>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="/a" title="Analytics" description="Measure what matters" />
            <NavigationMenuLink href="/b" title="Automations" description="Do less by hand" isCurrent />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Company</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="/about" title="About" />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/pricing">Pricing</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenu>
      <button>After</button>
    </>
  );
}

describe("NavigationMenu", () => {
  it("is a labelled nav landmark with buttons that expose expanded and controls", () => {
    render(<Menu />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Products" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    const controls = trigger.getAttribute("aria-controls")!;
    expect(document.getElementById(controls)).toBeInTheDocument();
  });

  it("opens with Enter, links are reachable by Tab, Escape closes and returns focus", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await user.tab();
    const trigger = screen.getByRole("button", { name: "Products" });
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.tab();
    expect(screen.getByRole("link", { name: "Analytics" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: /Automations/ })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("Down Arrow opens the panel and focuses the first link", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: "Analytics" })).toHaveFocus();
  });

  it("moves between top-level items with Left and Right", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Company" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Products" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveFocus();
  });

  it("opens another panel when moving trigger to trigger while one is open", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await user.tab();
    await user.keyboard("{Enter}{ArrowRight}");
    expect(screen.getByRole("button", { name: "Company" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on hover and closes when the pointer leaves", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    const trigger = screen.getByRole("button", { name: "Products" });
    await user.hover(trigger);
    await screen.findByRole("link", { name: "Analytics" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.unhover(trigger);
    await new Promise((r) => setTimeout(r, 20));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on a click outside and when focus leaves", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    const trigger = screen.getByRole("button", { name: "Products" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.click(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    await user.tab({ shift: false });
    await user.keyboard("{Tab}{Tab}{Tab}{Tab}");
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the current page and names links by title with the description as a description", async () => {
    const user = userEvent.setup();
    render(<Menu />);
    await user.click(screen.getByRole("button", { name: "Products" }));
    const current = screen.getByRole("link", { name: /Automations/ });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveAccessibleDescription("Do less by hand");
  });

  it("has no axe violations open or closed", async () => {
    const user = userEvent.setup();
    const { container } = render(<Menu />);
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Products" }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
