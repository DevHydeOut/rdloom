import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { toast, toastQueue, ToastRegion } from "../src";
import { axeViolations } from "./axe";

describe("Toast animated", () => {
  afterEach(() => {
    act(() => toastQueue.visibleToasts.forEach((t) => toastQueue.close(t.key)));
  });

  it("keeps the existing slide by default", async () => {
    render(<ToastRegion />);
    act(() => void toast({ title: "Saved", timeout: 0 }));
    const item = await screen.findByRole("alertdialog", { name: "Saved" });
    expect(item.className).toContain("duration-200");
    expect(item.className).toContain("data-[animation=queued]:translate-y-3");
    expect(item.className).not.toContain("calc(100%+1rem)");
  });

  it("slides in from the edge when animated, with a reduced-motion override", async () => {
    render(<ToastRegion />);
    act(() => void toast({ title: "Exported", animated: true, timeout: 0 }));
    const item = await screen.findByRole("alertdialog", { name: "Exported" });
    expect(item.className).toContain("data-[animation=queued]:translate-x-[calc(100%+1rem)]");
    expect(item.className).toContain("rtl:data-[animation=queued]:-translate-x-[calc(100%+1rem)]");
    expect(item.className).toContain("motion-reduce:transition-none");
    expect(item.className).toContain("motion-reduce:data-[animation=queued]:translate-x-0");
  });

  it("still dismisses and has no axe violations when animated", async () => {
    render(<ToastRegion />);
    act(() => void toast({ title: "Exported", animated: true, timeout: 0 }));
    await screen.findByRole("alertdialog", { name: "Exported" });
    expect(await axeViolations()).toEqual([]);
  });
});
