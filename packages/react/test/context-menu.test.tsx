import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ContextMenu, ContextMenuItem, ContextMenuSection, ContextMenuSeparator } from "../src";
import type { ContextMenuProps } from "../src";
import { axeViolations } from "./axe";

function Demo(props: Partial<ContextMenuProps>) {
  return (
    <div>
      <ContextMenu
        label="Actions for report.pdf"
        items={
          <>
            <ContextMenuSection title="Open">
              <ContextMenuItem id="open" shortcut="Enter">
                Open
              </ContextMenuItem>
              <ContextMenuItem id="copy">Copy link</ContextMenuItem>
            </ContextMenuSection>
            <ContextMenuSeparator />
            <ContextMenuItem id="archive" isDisabled>
              Archive
            </ContextMenuItem>
            <ContextMenuItem id="delete" variant="danger">
              Delete file
            </ContextMenuItem>
          </>
        }
        {...props}
      >
        report.pdf
      </ContextMenu>
      <button>Elsewhere</button>
    </div>
  );
}

// jsdom has no PointerEvent, so a small one with the fields the area reads.
class TestPointerEvent extends MouseEvent {
  pointerType: string;
  isPrimary: boolean;
  pointerId: number;
  constructor(type: string, init: PointerEventInit & { pointerType?: string } = {}) {
    super(type, { bubbles: true, cancelable: true, ...init });
    this.pointerType = init.pointerType ?? "mouse";
    this.isPrimary = init.isPrimary ?? true;
    this.pointerId = init.pointerId ?? 1;
  }
}
const pointer = (type: "pointerdown" | "pointermove" | "pointerup", target: Element, init: PointerEventInit & { pointerType?: string }) =>
  fireEvent(target, new TestPointerEvent(type, init));

const area = () => screen.getByText("report.pdf");
const menu = () => screen.queryByRole("menu", { name: "Actions for report.pdf" });

describe("ContextMenu", () => {
  it("opens at the pointer on a right click and the area is not otherwise changed", async () => {
    render(<Demo />);
    expect(menu()).not.toBeInTheDocument();
    const notPrevented = fireEvent.contextMenu(area(), { clientX: 120, clientY: 80 });
    expect(notPrevented).toBe(false); // the browser menu is replaced
    expect(await screen.findByRole("menu", { name: "Actions for report.pdf" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem").map((n) => n.textContent)).toEqual(["OpenEnter", "Copy link", "Archive", "Delete file"]);
    const anchor = document.body.querySelector<HTMLElement>("span.fixed");
    expect(anchor).toHaveStyle({ left: "120px", top: "80px" });
  });

  it("makes the area focusable with a hint for screen readers", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await waitFor(() => expect(area()).toHaveAttribute("aria-describedby"));
    expect(area()).toHaveAttribute("tabindex", "0");
    const hint = document.getElementById(area().getAttribute("aria-describedby")!);
    expect(hint).toHaveTextContent("Press Shift+F10 for actions");
    await user.tab();
    expect(area()).toHaveFocus();
  });

  it("opens from the keyboard with Shift+F10 and the Menu key, focusing the first item", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.tab();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("menuitem", { name: /Open/ })).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(menu()).not.toBeInTheDocument());
    await waitFor(() => expect(area()).toHaveFocus());
    await user.keyboard("{ContextMenu}");
    expect(await screen.findByRole("menu")).toBeInTheDocument();
  });

  it("moves with arrows (skipping nothing but wrapping), types to find, and runs an action", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Demo onAction={onAction} />);
    await user.tab();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await waitFor(() => expect(screen.getByRole("menuitem", { name: /Open/ })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Copy link" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Delete file" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("menuitem", { name: /Open/ })).toHaveFocus();
    await user.keyboard("c");
    expect(screen.getByRole("menuitem", { name: "Copy link" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onAction).toHaveBeenCalledExactlyOnceWith("copy");
    await waitFor(() => expect(menu()).not.toBeInTheDocument());
    await waitFor(() => expect(area()).toHaveFocus());
  });

  it("closes on Escape and when an item is clicked, returning focus to the area", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Demo onAction={onAction} />);
    fireEvent.contextMenu(area(), { clientX: 10, clientY: 10 });
    await screen.findByRole("menu");
    await user.click(screen.getByRole("menuitem", { name: "Delete file" }));
    expect(onAction).toHaveBeenCalledExactlyOnceWith("delete");
    await waitFor(() => expect(menu()).not.toBeInTheDocument());
    await waitFor(() => expect(area()).toHaveFocus());
  });

  it("does not run disabled items", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Demo onAction={onAction} />);
    fireEvent.contextMenu(area(), { clientX: 10, clientY: 10 });
    await screen.findByRole("menu");
    expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("menuitem", { name: "Archive" }));
    expect(onAction).not.toHaveBeenCalled();
  });

  it("opens on a touch long press, and not on a short tap or a drag", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<Demo />);
      const touch = { pointerType: "touch", clientX: 40, clientY: 40 };
      pointer("pointerdown", area(), touch);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      pointer("pointerup", area(), touch);
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(menu()).not.toBeInTheDocument();

      pointer("pointerdown", area(), touch);
      pointer("pointermove", area(), { ...touch, clientX: 80 });
      act(() => {
        vi.advanceTimersByTime(700);
      });
      expect(menu()).not.toBeInTheDocument();

      pointer("pointerdown", area(), touch);
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(document.body.querySelector<HTMLElement>("span.fixed")).toHaveStyle({ left: "40px", top: "40px" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not take over a mouse press and hold", () => {
    vi.useFakeTimers();
    try {
      render(<Demo />);
      pointer("pointerdown", area(), { pointerType: "mouse" });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(menu()).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("is checkable with selectionMode", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Demo selectionMode="multiple" defaultSelectedKeys={["open"]} onSelectionChange={onSelectionChange} />);
    fireEvent.contextMenu(area(), { clientX: 10, clientY: 10 });
    await screen.findByRole("menu");
    expect(screen.getByRole("menuitemcheckbox", { name: /Open/ })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Copy link" }));
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it("leaves the browser menu alone when disabled, and over text fields", () => {
    const { rerender } = render(<Demo isDisabled />);
    expect(area()).not.toHaveAttribute("tabindex");
    expect(fireEvent.contextMenu(area())).toBe(true);
    expect(menu()).not.toBeInTheDocument();
    rerender(
      <ContextMenu label="Edit" items={<ContextMenuItem id="a">A</ContextMenuItem>}>
        <input aria-label="Name" />
      </ContextMenu>,
    );
    expect(fireEvent.contextMenu(screen.getByLabelText("Name"))).toBe(true);
  });

  it("can render the area as another element", () => {
    render(
      <table>
        <tbody>
          <ContextMenu elementType="tr" label="Row actions" items={<ContextMenuItem id="a">A</ContextMenuItem>}>
            <td>cell</td>
          </ContextMenu>
        </tbody>
      </table>,
    );
    expect(screen.getByText("cell").closest("tr")).toHaveAttribute("tabindex", "0");
  });

  it("has no axe violations, closed or open", async () => {
    const { container } = render(<Demo />);
    expect(await axeViolations(container)).toEqual([]);
    fireEvent.contextMenu(area(), { clientX: 10, clientY: 10 });
    await screen.findByRole("menu");
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it("renders the area on the server", () => {
    const html = renderToString(<Demo />);
    expect(html).toContain("report.pdf");
    expect(html).toContain('tabindex="0"');
  });
});
