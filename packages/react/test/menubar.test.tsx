import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Menubar, MenubarGroup, MenubarItem, MenubarMenu, MenubarSeparator, MenubarSubmenu } from "../src";
import { axeViolations } from "./axe";

function Bar({ onNew = () => {}, onWrap = () => {} }: { onNew?: () => void; onWrap?: (keys: Set<unknown>) => void }) {
  return (
    <Menubar label="Application">
      <MenubarMenu label="File">
        <MenubarItem id="new" shortcut={["⌘", "N"]} onAction={onNew}>
          New file
        </MenubarItem>
        <MenubarSubmenu label="Share">
          <MenubarItem id="email">Email link</MenubarItem>
        </MenubarSubmenu>
        <MenubarSeparator />
        <MenubarItem id="print" isDisabled>
          Print
        </MenubarItem>
      </MenubarMenu>
      <MenubarMenu label="Edit">
        <MenubarItem id="undo">Undo</MenubarItem>
      </MenubarMenu>
      <MenubarMenu label="View">
        <MenubarGroup selectionMode="multiple" defaultSelectedKeys={["grid"]} aria-label="Panels">
          <MenubarItem id="grid">Show grid</MenubarItem>
          <MenubarItem id="rulers">Show rulers</MenubarItem>
        </MenubarGroup>
        <MenubarSeparator />
        <MenubarGroup selectionMode="single" defaultSelectedKeys={["wrap"]} aria-label="Wrap" onSelectionChange={onWrap}>
          <MenubarItem id="wrap">Wrap</MenubarItem>
          <MenubarItem id="scroll">Scroll</MenubarItem>
        </MenubarGroup>
      </MenubarMenu>
    </Menubar>
  );
}

const trigger = (name: string) => screen.getByRole("menuitem", { name, hidden: true });

describe("Menubar", () => {
  it("is a menubar whose triggers are menu items with one tab stop", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>Before</button>
        <Bar />
        <button>After</button>
      </>,
    );
    expect(screen.getByRole("menubar", { name: "Application" })).toBeInTheDocument();
    expect(trigger("File")).toHaveAttribute("aria-haspopup");
    expect(trigger("Edit")).toHaveAttribute("tabindex", "-1");
    await user.tab();
    await user.tab();
    expect(trigger("File")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("moves between menus with Left and Right (wrapping) and Home and End", async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(trigger("Edit")).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(trigger("View")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(trigger("File")).toHaveFocus();
    await user.keyboard("{End}");
    expect(trigger("View")).toHaveFocus();
  });

  it("opens with Down Arrow, shows the shortcut in Kbd, and Escape returns focus", async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByRole("menuitem", { name: /New file/ })).toHaveFocus();
    expect(document.querySelectorAll("kbd")).toHaveLength(2);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger("File")).toHaveAttribute("aria-expanded", "false"));
    expect(trigger("File")).toHaveFocus();
  });

  it("moves to the neighbouring menu with Right while one is open", async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("menuitem", { name: /New file/ });
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(trigger("Edit")).toHaveAttribute("aria-expanded", "true"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "false");
    expect(await screen.findByRole("menuitem", { name: "Undo" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(trigger("File")).toHaveAttribute("aria-expanded", "true"));
  });

  it("opens a submenu with Right and closes it with Left without leaving the menu", async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Share" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(await screen.findByRole("menuitem", { name: "Email link" })).toHaveFocus();
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Share" })).toHaveFocus());
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");
  });

  it("runs an action and closes the menu", async () => {
    const user = userEvent.setup();
    const onNew = vi.fn();
    render(<Bar onNew={onNew} />);
    await user.click(trigger("File"));
    await user.click(await screen.findByRole("menuitem", { name: /New file/ }));
    expect(onNew).toHaveBeenCalled();
    await waitFor(() => expect(trigger("File")).toHaveAttribute("aria-expanded", "false"));
  });

  it("switches menus on hover while one is open", async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await user.click(trigger("File"));
    await user.hover(trigger("Edit"));
    await waitFor(() => expect(trigger("Edit")).toHaveAttribute("aria-expanded", "true"));
  });

  it("has checkbox and radio items with checked state", async () => {
    const user = userEvent.setup();
    const onWrap = vi.fn();
    render(<Bar onWrap={onWrap} />);
    await user.click(trigger("View"));
    expect(await screen.findByRole("menuitemcheckbox", { name: "Show grid" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemcheckbox", { name: "Show rulers" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("menuitemradio", { name: "Wrap" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("menuitemradio", { name: "Scroll" }));
    expect(onWrap).toHaveBeenCalled();
  });

  it("shows disabled items and skips them with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Bar />);
    await user.click(trigger("File"));
    const print = await screen.findByRole("menuitem", { name: "Print" });
    expect(print).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(print).not.toHaveFocus();
  });

  it("has no axe violations closed or open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Bar />);
    expect(await axeViolations(container)).toEqual([]);
    await user.click(trigger("View"));
    await screen.findByRole("menuitemradio", { name: "Wrap" });
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
