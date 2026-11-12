import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SwipeableRow, type SwipeAction } from "../src";
import { axeViolations } from "./axe";

// jsdom has no PointerEvent, so build pointer events from mouse events and give them a clock we control.
function pointer(el: Element, type: string, x: number, y: number, t: number) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
  Object.defineProperty(e, "pointerId", { value: 1 });
  Object.defineProperty(e, "pointerType", { value: "touch" });
  Object.defineProperty(e, "timeStamp", { value: t });
  fireEvent(el, e);
}

/** Drag from (0,0) by dx, dy over `ms`, then lift. Slow by default so a release is a drag, not a flick. */
function swipe(el: Element, dx: number, dy = 0, ms = 2000) {
  pointer(el, "pointerdown", 100, 100, 0);
  pointer(el, "pointermove", 100 + dx / 2, 100 + dy / 2, ms / 2);
  pointer(el, "pointermove", 100 + dx, 100 + dy, ms);
  pointer(el, "pointerup", 100 + dx, 100 + dy, ms + 1);
}

const archive = (onAction = vi.fn()): SwipeAction => ({ id: "archive", label: "Archive", onAction });
const del = (onAction = vi.fn()): SwipeAction => ({ id: "delete", label: "Delete", tone: "danger", onAction });

const setup = (props: Partial<React.ComponentProps<typeof SwipeableRow>> = {}) =>
  render(
    <SwipeableRow actionsLabel="Actions for Ana" endActions={[archive(), del()]} {...props}>
      <button type="button">Open message</button>
    </SwipeableRow>,
  );

const content = () => screen.getByRole("button", { name: "Open message" }).parentElement as HTMLElement;
const root = () => content().parentElement as HTMLElement;
const actions = () => root().querySelector<HTMLElement>("[role=group]");
const isShown = () => getComputedStyle(actions() as HTMLElement).visibility === "visible";

afterEach(() => vi.restoreAllMocks());

describe("SwipeableRow", () => {
  it("shows the content and keeps the actions out of the page until asked", () => {
    setup();
    expect(screen.getByRole("button", { name: "Open message" })).toBeInTheDocument();
    expect(isShown()).toBe(false);
    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    expect(root()).not.toHaveAttribute("data-open");
  });

  it("is only its content when there are no actions", () => {
    render(
      <SwipeableRow>
        <p>Plain row</p>
      </SwipeableRow>,
    );
    expect(screen.getByText("Plain row")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  describe("the swipe", () => {
    it("opens the end actions on a swipe toward the start", () => {
      const onOpenChange = vi.fn();
      setup({ onOpenChange });
      swipe(content(), -150);
      expect(root()).toHaveAttribute("data-open", "end");
      expect(onOpenChange).toHaveBeenCalledWith("end");
      expect(isShown()).toBe(true);
      expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
      expect(content().style.transform).toBe("translateX(-160px)");
    });

    it("opens the start actions on a swipe toward the end", () => {
      setup({ startActions: [archive()], endActions: undefined });
      swipe(content(), 90);
      expect(root()).toHaveAttribute("data-open", "start");
      expect(content().style.transform).toBe("translateX(80px)");
    });

    it("springs back when the swipe is short", () => {
      setup();
      swipe(content(), -30);
      expect(root()).not.toHaveAttribute("data-open");
    });

    it("follows the finger while it is down", () => {
      setup();
      pointer(content(), "pointerdown", 100, 100, 0);
      pointer(content(), "pointermove", 60, 100, 50);
      expect(content().style.transform).toBe("translateX(-40px)");
      expect(root()).toHaveAttribute("data-dragging");
      pointer(content(), "pointerup", 60, 100, 2000);
      expect(root()).not.toHaveAttribute("data-dragging");
    });

    it("opens on a quick flick that is too short to reach the halfway point", () => {
      setup();
      swipe(content(), -40, 0, 60);
      expect(root()).toHaveAttribute("data-open", "end");
    });

    it("leaves vertical movement to the page's scrolling", () => {
      setup();
      swipe(content(), -150, 200);
      expect(root()).not.toHaveAttribute("data-open");
      expect(content().style.transform).toBe("");
    });

    it("ignores a tiny movement, so a tap is still a tap", () => {
      setup();
      swipe(content(), -4, 2);
      expect(root()).not.toHaveAttribute("data-open");
    });

    it("does nothing when a pointer is cancelled", () => {
      setup();
      pointer(content(), "pointerdown", 100, 100, 0);
      pointer(content(), "pointermove", -100, 100, 100);
      pointer(content(), "pointercancel", -100, 100, 101);
      expect(root()).not.toHaveAttribute("data-open");
      expect(root()).not.toHaveAttribute("data-dragging");
    });

    it("does not swipe toward a side that has no actions", () => {
      setup();
      swipe(content(), 150);
      expect(root()).not.toHaveAttribute("data-open");
      expect(content().style.transform).toBe("");
    });

    it("does not swipe when disabled, and the button still reaches the actions", async () => {
      setup({ isDisabled: true });
      swipe(content(), -150);
      expect(root()).not.toHaveAttribute("data-open");
      await userEvent.setup().click(screen.getByRole("button", { name: "Actions for Ana" }));
      expect(root()).toHaveAttribute("data-open", "end");
    });

    it("does not click what was under the finger after a swipe", () => {
      const onClick = vi.fn();
      render(
        <SwipeableRow endActions={[archive()]}>
          <button type="button" onClick={onClick}>
            Open message
          </button>
        </SwipeableRow>,
      );
      swipe(content(), -150);
      fireEvent.click(screen.getByRole("button", { name: "Open message" }));
      expect(onClick).not.toHaveBeenCalled();
    });

    it("closes an open row with a tap on it instead of activating it", () => {
      const onClick = vi.fn();
      render(
        <SwipeableRow endActions={[archive()]} defaultOpen="end">
          <button type="button" onClick={onClick}>
            Open message
          </button>
        </SwipeableRow>,
      );
      expect(root()).toHaveAttribute("data-open", "end");
      fireEvent.click(screen.getByRole("button", { name: "Open message" }));
      expect(onClick).not.toHaveBeenCalled();
      expect(root()).not.toHaveAttribute("data-open");
      fireEvent.click(screen.getByRole("button", { name: "Open message" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("can close an open row by swiping it back", () => {
      setup({ defaultOpen: "end" });
      swipe(content(), 150);
      expect(root()).not.toHaveAttribute("data-open");
    });
  });

  describe("full swipe", () => {
    const wide = () => vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(320);

    it("runs the first action on a long swipe and closes", () => {
      wide();
      const first = vi.fn();
      const second = vi.fn();
      setup({ fullSwipe: true, endActions: [archive(first), del(second)] });
      swipe(content(), -250);
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
      expect(root()).not.toHaveAttribute("data-open");
    });

    it("only opens the actions on the same swipe when fullSwipe is off", () => {
      wide();
      const first = vi.fn();
      setup({ endActions: [archive(first)] });
      swipe(content(), -250);
      expect(first).not.toHaveBeenCalled();
      expect(root()).toHaveAttribute("data-open", "end");
    });

    it("skips a first action the person may not run", () => {
      wide();
      const first = vi.fn();
      const second = vi.fn();
      setup({ fullSwipe: true, endActions: [{ ...archive(first), permission: false }, del(second)] });
      swipe(content(), -250);
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe("without a swipe", () => {
    it("has a named button that shows the actions and says so", async () => {
      const user = userEvent.setup();
      setup();
      const toggle = screen.getByRole("button", { name: "Actions for Ana" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await user.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("group", { name: "Actions for Ana" })).toBeInTheDocument();
    });

    it("moves focus to the first action when opened from the keyboard, and Escape returns to the button", async () => {
      const user = userEvent.setup();
      setup();
      await user.tab(); // the row's own button
      await user.tab(); // the actions button
      expect(screen.getByRole("button", { name: "Actions for Ana" })).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(screen.getByRole("button", { name: "Archive" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
      await user.keyboard("{Escape}");
      expect(root()).not.toHaveAttribute("data-open");
      expect(screen.getByRole("button", { name: "Actions for Ana" })).toHaveFocus();
    });

    it("keeps the actions out of the tab order while closed", async () => {
      const user = userEvent.setup();
      setup();
      await user.tab();
      await user.tab();
      await user.tab();
      expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
      expect(document.body).toHaveFocus();
    });

    it("toggles closed from the same button", async () => {
      const user = userEvent.setup();
      setup();
      const toggle = screen.getByRole("button", { name: "Actions for Ana" });
      await user.click(toggle);
      await user.click(toggle);
      expect(root()).not.toHaveAttribute("data-open");
    });

    it("opens the start side when there are only start actions", async () => {
      setup({ startActions: [archive()], endActions: undefined });
      await userEvent.setup().click(screen.getByRole("button", { name: "Actions for Ana" }));
      expect(root()).toHaveAttribute("data-open", "start");
    });
  });

  describe("actions", () => {
    it("runs an action and closes the row, putting focus back on the button", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      setup({ endActions: [archive(onAction)] });
      await user.click(screen.getByRole("button", { name: "Actions for Ana" }));
      await user.keyboard("{Enter}");
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(root()).not.toHaveAttribute("data-open");
      expect(screen.getByRole("button", { name: "Actions for Ana" })).toHaveFocus();
    });

    it("keeps the row open after an action with closeOnAction=false", async () => {
      const user = userEvent.setup();
      setup({ closeOnAction: false, defaultOpen: "end" });
      await user.click(screen.getByRole("button", { name: "Archive" }));
      expect(root()).toHaveAttribute("data-open", "end");
    });

    it("draws the label as text, so an icon is never the only name", () => {
      setup({ defaultOpen: "end", endActions: [{ ...archive(), icon: <svg data-testid="icon" /> }] });
      expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
      expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
    });

    it("gives every action the same width", () => {
      setup({ defaultOpen: "end" });
      expect(actions()?.style.width).toBe("160px");
    });
  });

  describe("permissions", () => {
    it("does not draw a hidden action, and a side with only hidden actions cannot open", () => {
      setup({ defaultOpen: "end", endActions: [archive(), { ...del(), permission: "hidden" }] });
      expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
      expect(actions()?.style.width).toBe("80px");

      const { container } = render(
        <SwipeableRow defaultOpen="end" endActions={[{ ...del(), permission: "hidden" }]}>
          <p>Only hidden</p>
        </SwipeableRow>,
      );
      expect(container.querySelector("[data-open]")).toBeNull();
      expect(container.querySelector("button")).toBeNull();
    });

    it("keeps a disabled action focusable, inactive and explained", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      setup({ defaultOpen: "end", endActions: [{ ...del(onAction), permission: { state: "disabled", reason: "Only admins can delete" } }] });
      const button = screen.getByRole("button", { name: "Delete" });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription("Only admins can delete");
      await user.click(button);
      expect(onAction).not.toHaveBeenCalled();
      expect(root()).toHaveAttribute("data-open", "end");
    });
  });

  describe("controlled and uncontrolled", () => {
    it("starts open with defaultOpen", () => {
      setup({ defaultOpen: "end" });
      expect(root()).toHaveAttribute("data-open", "end");
      expect(isShown()).toBe(true);
    });

    it("follows open and reports changes without changing itself", () => {
      const onOpenChange = vi.fn();
      setup({ open: null, onOpenChange });
      swipe(content(), -150);
      expect(onOpenChange).toHaveBeenCalledWith("end");
      expect(root()).not.toHaveAttribute("data-open");
    });

    it("works as a controlled row", async () => {
      function Controlled() {
        const [open, setOpen] = useState<"start" | "end" | null>(null);
        return (
          <>
            <button type="button" onClick={() => setOpen("end")}>
              Show
            </button>
            <SwipeableRow open={open} onOpenChange={setOpen} endActions={[archive()]}>
              <button type="button">Open message</button>
            </SwipeableRow>
          </>
        );
      }
      render(<Controlled />);
      await userEvent.setup().click(screen.getByRole("button", { name: "Show" }));
      expect(root()).toHaveAttribute("data-open", "end");
      swipe(content(), 150);
      expect(root()).not.toHaveAttribute("data-open");
    });

    it("keeps only one row open in a list when the parent says so", () => {
      function List() {
        const [openId, setOpenId] = useState<string | null>(null);
        return (
          <>
            {["a", "b"].map((id) => (
              <SwipeableRow key={id} open={openId === id ? "end" : null} onOpenChange={(s) => setOpenId(s ? id : null)} endActions={[archive()]} actionsLabel={`Actions ${id}`}>
                <button type="button">Row {id}</button>
              </SwipeableRow>
            ))}
          </>
        );
      }
      const { container } = render(<List />);
      const rows = () => Array.from(container.querySelectorAll("[data-open]"));
      const contentOf = (name: string) => screen.getByRole("button", { name }).parentElement as HTMLElement;
      swipe(contentOf("Row a"), -150);
      expect(rows()).toHaveLength(1);
      swipe(contentOf("Row b"), -150);
      expect(rows()).toHaveLength(1);
      expect(rows()[0]).toContainElement(screen.getByRole("button", { name: "Row b" }));
    });

    it("closes when a press lands outside the row", () => {
      setup({ defaultOpen: "end" });
      act(() => {
        fireEvent.pointerDown(document.body);
      });
      expect(root()).not.toHaveAttribute("data-open");
    });
  });

  describe("reading direction", () => {
    it("swaps the sides in a right to left page", () => {
      const real = window.getComputedStyle.bind(window);
      const spy = vi.spyOn(window, "getComputedStyle").mockImplementation((el, pseudo) => {
        const style = real(el, pseudo);
        return new Proxy(style, {
          get: (target, key) => (key === "direction" ? "rtl" : typeof (target as never)[key] === "function" ? ((target as never)[key] as () => unknown).bind(target) : (target as never)[key]),
        });
      });
      setup();
      // Dragging to the right is toward the start of the text, which reveals the end actions.
      swipe(content(), 150);
      expect(root()).toHaveAttribute("data-open", "end");
      expect(content().style.transform).toBe("translateX(160px)");
      spy.mockRestore();
    });
  });

  it("adds className and slot classNames after the built-in ones, and forwards the ref", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <SwipeableRow ref={ref} className="own" defaultOpen="end" endActions={[archive()]} classNames={{ root: "r", content: "c", actions: "a", action: "x", toggle: "t" }}>
        <p>Row</p>
      </SwipeableRow>,
    );
    expect(ref.current).toHaveClass("own", "r");
    expect(ref.current?.querySelector(".c")).not.toBeNull();
    expect(ref.current?.querySelector(".a")).not.toBeNull();
    expect(ref.current?.querySelector(".x")).not.toBeNull();
    expect(ref.current?.querySelector(".t")).not.toBeNull();
  });

  it("lets the page scroll vertically over the row and drops that when there is nothing to swipe", () => {
    const { rerender } = setup();
    expect(content()).toHaveClass("touch-pan-y");
    rerender(
      <SwipeableRow isDisabled endActions={[archive()]}>
        <button type="button">Open message</button>
      </SwipeableRow>,
    );
    expect(content()).not.toHaveClass("touch-pan-y");
  });

  it("has no accessibility violations closed, open, with a disabled action, or controlled", async () => {
    for (const props of [{}, { defaultOpen: "end" as const }, { defaultOpen: "end" as const, endActions: [archive(), { ...del(), permission: { state: "disabled" as const, reason: "No access" } }] }, { startActions: [archive()], defaultOpen: "start" as const }]) {
      const { container, unmount } = setup(props);
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });
});
