import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button, DialogTrigger, Drawer } from "../src";
import { axeViolations } from "./axe";

const original = window.innerHeight;
beforeEach(() => Object.defineProperty(window, "innerHeight", { value: 1000, configurable: true, writable: true }));
afterEach(() => {
  Object.defineProperty(window, "innerHeight", { value: original, configurable: true, writable: true });
  vi.restoreAllMocks();
});

const setup = (props: Partial<ComponentProps<typeof Drawer>> = {}) =>
  render(
    <DialogTrigger>
      <Button>Open</Button>
      <Drawer title="Places" snapPoints={[0.3, 0.6, 0.9]} {...props}>
        {({ close }) => <Button onPress={close}>Done</Button>}
      </Drawer>
    </DialogTrigger>,
  );

// jsdom has no PointerEvent, so build pointer events from mouse events and give them a clock we control.
function pointer(el: Element, type: string, clientY: number, t: number) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientY });
  Object.defineProperty(e, "pointerId", { value: 1 });
  Object.defineProperty(e, "pointerType", { value: "touch" });
  Object.defineProperty(e, "timeStamp", { value: t });
  fireEvent(el, e);
}

/** Drag from y=500 to y=500-up (a positive `up` drags the sheet up), slowly by default. */
function drag(surface: Element, up: number, ms = 2000) {
  pointer(surface, "pointerdown", 500, 0);
  pointer(surface, "pointermove", 500 - up / 2, ms / 2);
  pointer(surface, "pointermove", 500 - up, ms);
  pointer(surface, "pointerup", 500 - up, ms + 1);
}

async function openIt() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = await screen.findByRole("dialog");
  const surface = dialog.querySelector<HTMLElement>(".touch-none") as HTMLElement;
  const panel = dialog.closest<HTMLElement>("[data-rd-drawer]") as HTMLElement;
  return { user, dialog, surface, panel };
}

describe("Drawer with snap points", () => {
  it("opens at the first snap point, as a share of the screen", async () => {
    setup();
    const { panel } = await openIt();
    expect(panel.style.height).toBe("300px");
    expect(panel).toHaveAttribute("data-snap", "0");
  });

  it("opens at defaultSnap", async () => {
    setup({ defaultSnap: 1 });
    const { panel } = await openIt();
    expect(panel.style.height).toBe("600px");
  });

  it("takes the points in any order and keeps defaultSnap an index into the sorted list", async () => {
    setup({ snapPoints: [0.9, 0.3], defaultSnap: 0 });
    const { panel } = await openIt();
    expect(panel.style.height).toBe("300px");
  });

  it("keeps a plain drawer as tall as its content when there are no snap points", async () => {
    setup({ snapPoints: undefined });
    const { panel } = await openIt();
    expect(panel.style.height).toBe("");
    expect(panel).not.toHaveAttribute("data-snap");
    expect(screen.queryByRole("button", { name: "Expand" })).not.toBeInTheDocument();
  });

  describe("dragging", () => {
    it("follows the finger up while it is down", async () => {
      setup();
      const { surface, panel } = await openIt();
      pointer(surface, "pointerdown", 500, 0);
      pointer(surface, "pointermove", 400, 50);
      expect(panel.style.height).toBe("400px");
      pointer(surface, "pointerup", 400, 2000);
    });

    it("settles on the nearest point when let go", async () => {
      setup();
      const { surface, panel } = await openIt();
      drag(surface, 250);
      expect(panel.style.height).toBe("600px");
      drag(surface, 280);
      expect(panel.style.height).toBe("900px");
    });

    it("goes back down a point with a drag down", async () => {
      setup({ defaultSnap: 2 });
      const { surface, panel } = await openIt();
      drag(surface, -280);
      expect(panel.style.height).toBe("600px");
    });

    it("springs back to the same point after a short drag", async () => {
      setup({ defaultSnap: 1 });
      const { surface, panel } = await openIt();
      drag(surface, 60);
      expect(panel.style.height).toBe("600px");
    });

    it("carries on with a quick flick", async () => {
      setup();
      const { surface, panel } = await openIt();
      // 60px up is closer to the lowest point, but done in 60 ms it is a flick toward the next one.
      drag(surface, 60, 60);
      expect(panel.style.height).toBe("600px");
    });

    it("closes with a long drag down from the lowest point", async () => {
      setup();
      const { surface } = await openIt();
      drag(surface, -200);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("stays open after a short drag down from the lowest point", async () => {
      setup();
      const { surface, panel } = await openIt();
      drag(surface, -60);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(panel.style.height).toBe("300px");
    });

    it("does not close from the lowest point when it cannot be dismissed, and ignores dragging", async () => {
      setup({ isDismissable: false });
      const { surface, panel } = await openIt();
      drag(surface, -250);
      drag(surface, 300);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(panel.style.height).toBe("300px");
    });

    it("returns to rest when a pointer is cancelled", async () => {
      setup();
      const { surface, panel } = await openIt();
      pointer(surface, "pointerdown", 500, 0);
      pointer(surface, "pointermove", 300, 100);
      pointer(surface, "pointercancel", 300, 101);
      expect(panel.style.height).toBe("300px");
    });
  });

  describe("without dragging", () => {
    it("has a named button that steps to the next height and announces it", async () => {
      setup();
      const { user, panel } = await openIt();
      const button = screen.getByRole("button", { name: "Expand" });
      await user.click(button);
      expect(panel.style.height).toBe("600px");
      expect(screen.getByRole("status")).toHaveTextContent("Expanded");
    });

    it("says Collapse at the top and goes back to the lowest point", async () => {
      setup({ defaultSnap: 2 });
      const { user, panel } = await openIt();
      await user.click(screen.getByRole("button", { name: "Collapse" }));
      expect(panel.style.height).toBe("300px");
      expect(screen.getByRole("status")).toHaveTextContent("Collapsed");
    });

    it("moves with Arrow Up and Arrow Down, staying inside the list", async () => {
      setup();
      const { user, panel } = await openIt();
      screen.getByRole("button", { name: "Expand" }).focus();
      await user.keyboard("{ArrowUp}");
      expect(panel.style.height).toBe("600px");
      await user.keyboard("{ArrowUp}{ArrowUp}");
      expect(panel.style.height).toBe("900px");
      await user.keyboard("{ArrowDown}");
      expect(panel.style.height).toBe("600px");
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(panel.style.height).toBe("300px");
    });

    it("is reached with Tab and does not start a drag when pressed", async () => {
      setup();
      const { user, panel } = await openIt();
      await user.tab();
      expect(screen.getByRole("button", { name: "Expand" })).toHaveFocus();
      pointer(screen.getByRole("button", { name: "Expand" }), "pointerdown", 500, 0);
      pointer(screen.getByRole("button", { name: "Expand" }), "pointermove", 100, 50);
      expect(panel.style.height).toBe("300px");
    });

    it("has no button with a single snap point", async () => {
      setup({ snapPoints: [0.5] });
      await openIt();
      expect(screen.queryByRole("button", { name: "Expand" })).not.toBeInTheDocument();
    });

    it("takes its words from labels", async () => {
      setup({ labels: { expand: "Más", collapse: "Menos", expanded: "Más grande", collapsed: "Más pequeño" } });
      const { user } = await openIt();
      await user.click(screen.getByRole("button", { name: "Más" }));
      expect(screen.getByRole("status")).toHaveTextContent("Más grande");
    });
  });

  describe("control", () => {
    it("shows the snap point it is given and reports changes without changing itself", async () => {
      const onSnapChange = vi.fn();
      setup({ snap: 1, onSnapChange });
      const { user, panel } = await openIt();
      expect(panel.style.height).toBe("600px");
      await user.click(screen.getByRole("button", { name: "Expand" }));
      expect(onSnapChange).toHaveBeenCalledWith(2);
      expect(panel.style.height).toBe("600px");
    });

    it("reports the new index when it settles on another point, and not when it stays", async () => {
      const onSnapChange = vi.fn();
      setup({ onSnapChange });
      const { surface } = await openIt();
      drag(surface, 20);
      expect(onSnapChange).not.toHaveBeenCalled();
      drag(surface, 250);
      expect(onSnapChange).toHaveBeenCalledWith(1);
    });

    it("keeps a controlled index inside the list", async () => {
      setup({ snap: 9 });
      const { panel } = await openIt();
      expect(panel.style.height).toBe("900px");
    });

    it("opens at defaultSnap again each time it is opened", async () => {
      setup();
      const { user, surface, panel } = await openIt();
      drag(surface, 250);
      expect(panel.style.height).toBe("600px");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Open" }));
      await screen.findByRole("dialog");
      expect((screen.getByRole("dialog").closest("[data-rd-drawer]") as HTMLElement).style.height).toBe("300px");
    });
  });

  describe("the space", () => {
    it("takes shares of the container when portalContainer is given", async () => {
      const container = document.createElement("div");
      Object.defineProperty(container, "clientHeight", { value: 500 });
      document.body.appendChild(container);
      setup({ portalContainer: container });
      const { panel } = await openIt();
      expect(panel.style.height).toBe("150px");
      container.remove();
    });

    it("follows the screen when it is resized", async () => {
      setup();
      const { panel } = await openIt();
      Object.defineProperty(window, "innerHeight", { value: 500, configurable: true, writable: true });
      fireEvent(window, new Event("resize"));
      await waitFor(() => expect(panel.style.height).toBe("150px"));
    });
  });

  it("still closes with Escape and a close button", async () => {
    setup();
    const { user } = await openIt();
    await user.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("has no accessibility violations with snap points", async () => {
    setup();
    await openIt();
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
