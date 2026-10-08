import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { Button, DialogTrigger, Drawer } from "../src";
import { axeViolations } from "./axe";

const setup = (props: Partial<ComponentProps<typeof Drawer>> = {}) =>
  render(
    <DialogTrigger>
      <Button>Open</Button>
      <Drawer title="Share" description="Anyone with the link." {...props}>
        {({ close }) => <Button onPress={close}>Done</Button>}
      </Drawer>
    </DialogTrigger>,
  );

// jsdom has no PointerEvent, so build pointer events from mouse events.
function pointer(el: Element, type: string, clientY: number) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientY });
  Object.defineProperty(e, "pointerId", { value: 1 });
  Object.defineProperty(e, "pointerType", { value: "touch" });
  fireEvent(el, e);
}

async function openIt() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = await screen.findByRole("dialog");
  const surface = dialog.querySelector<HTMLElement>(".touch-none") as HTMLElement;
  return { user, dialog, surface };
}

describe("Drawer", () => {
  it("opens as a named dialog and returns focus to the trigger on Escape", async () => {
    setup();
    const { user } = await openIt();
    expect(screen.getByRole("dialog", { name: "Share" })).toBeInTheDocument();
    expect(screen.getByText("Anyone with the link.")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Open" })).toHaveFocus());
  });

  it("keeps focus inside while open", async () => {
    setup();
    const { user, dialog } = await openIt();
    await user.tab();
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("passes the close function to its children", async () => {
    setup();
    const { user } = await openIt();
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the handle is dragged far enough down", async () => {
    setup();
    const { surface } = await openIt();
    pointer(surface, "pointerdown", 100);
    pointer(surface, "pointermove", 150);
    pointer(surface, "pointerup", 260);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays open after a short drag", async () => {
    setup();
    const { surface } = await openIt();
    pointer(surface, "pointerdown", 100);
    pointer(surface, "pointerup", 110);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("ignores dragging when isDismissable is false", async () => {
    setup({ isDismissable: false });
    const { surface } = await openIt();
    pointer(surface, "pointerdown", 100);
    pointer(surface, "pointerup", 400);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has no axe violations when open", async () => {
    setup();
    await openIt();
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
