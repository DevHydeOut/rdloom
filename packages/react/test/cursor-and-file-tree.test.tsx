import { act, createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileTree, Pointer, SmoothCursor, type FileTreeNode } from "../src";
import { axeViolations } from "./axe";

function mockMotionPreference(reduce: boolean) {
  const query = { matches: reduce, media: "(prefers-reduced-motion: reduce)", addEventListener: () => {}, removeEventListener: () => {} };
  vi.stubGlobal("matchMedia", () => query);
}

beforeEach(() => mockMotionPreference(false));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// jsdom has no PointerEvent, so the coordinates and pointer type are defined on the event itself.
const move = (el: HTMLElement, x = 10, y = 10, type = "mouse") => {
  const event = createEvent.pointerMove(el);
  Object.defineProperties(event, { clientX: { value: x }, clientY: { value: y }, pointerType: { value: type } });
  fireEvent(el, event);
};
const touchMove = (el: HTMLElement) => move(el, 10, 10, "touch");

describe("SmoothCursor", () => {
  it("renders an aria-hidden, pointer-transparent follower and keeps the system cursor by default", () => {
    const { container } = render(<SmoothCursor>Area</SmoothCursor>);
    const root = container.firstElementChild as HTMLElement;
    const follower = root.querySelector("[data-rdm-cursor]") as HTMLElement;
    expect(follower).toHaveAttribute("aria-hidden", "true");
    expect(follower.style.pointerEvents).toBe("none");
    expect(follower.style.opacity).toBe("0");
    move(root, 20, 30);
    expect(follower.style.opacity).not.toBe("0");
    expect(root.style.cursor).toBe("");
  });

  it("hides the system cursor only when asked, only after a mouse, and restores it", () => {
    const { container, unmount } = render(<SmoothCursor hideNativeCursor>Area</SmoothCursor>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.cursor).toBe("");
    move(root, 5, 5);
    expect(root.style.cursor).toBe("none");
    fireEvent.pointerLeave(root);
    unmount();
    expect(root.style.cursor).toBe("");
  });

  it("does nothing for touch input", () => {
    const { container } = render(<SmoothCursor hideNativeCursor>Area</SmoothCursor>);
    const root = container.firstElementChild as HTMLElement;
    touchMove(root);
    expect((root.querySelector("[data-rdm-cursor]") as HTMLElement).style.opacity).toBe("0");
    expect(root.style.cursor).toBe("");
  });

  it("is absent with isStill, with reduced motion and inside rdm-still", () => {
    const still = render(<SmoothCursor isStill>Area</SmoothCursor>);
    expect(still.container.querySelector("[data-rdm-cursor]")).toBeNull();
    mockMotionPreference(true);
    const reduced = render(<SmoothCursor>Area</SmoothCursor>);
    expect(reduced.container.querySelector("[data-rdm-cursor]")).toBeNull();
    mockMotionPreference(false);
    const wrapped = render(
      <div className="rdm-still">
        <SmoothCursor>Area</SmoothCursor>
      </div>,
    );
    const inner = wrapped.container.querySelector(".relative") as HTMLElement;
    move(inner, 5, 5);
    expect((inner.querySelector("[data-rdm-cursor]") as HTMLElement).style.opacity).toBe("0");
  });

  it("eases toward the pointer and cancels its frame loop on unmount", () => {
    vi.useFakeTimers();
    const cancel = vi.spyOn(globalThis, "cancelAnimationFrame");
    const { container, unmount } = render(<SmoothCursor size={10}>Area</SmoothCursor>);
    const root = container.firstElementChild as HTMLElement;
    const follower = root.querySelector("[data-rdm-cursor]") as HTMLElement;
    move(root, 0, 0);
    move(root, 100, 0);
    act(() => {
      vi.advanceTimersByTime(32);
    });
    const x = parseFloat(follower.style.transform.replace("translate3d(", ""));
    expect(x).toBeGreaterThan(-5);
    expect(x).toBeLessThan(95);
    unmount();
    expect(cancel).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("listens on the document for the page scope and removes the listener", () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<SmoothCursor scope="page" />);
    expect(add.mock.calls.some(([type]) => type === "pointermove")).toBe(true);
    unmount();
    expect(remove.mock.calls.some(([type]) => type === "pointermove")).toBe(true);
  });

  it("keeps its children readable and has no axe violations", async () => {
    const { container } = render(
      <SmoothCursor shape="ring">
        <button type="button">Press</button>
      </SmoothCursor>,
    );
    expect(screen.getByRole("button", { name: "Press" })).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders its children on the server", () => {
    expect(renderToString(<SmoothCursor>Server text</SmoothCursor>)).toContain("Server text");
  });
});

describe("Pointer", () => {
  it("shows a named tag that follows the mouse and hides on leave", () => {
    const { container } = render(<Pointer name="Maya">Canvas</Pointer>);
    const root = container.firstElementChild as HTMLElement;
    const mark = root.querySelector("[data-rdm-pointer]") as HTMLElement;
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).toHaveTextContent("Maya");
    expect(mark.style.pointerEvents).toBe("none");
    expect(mark.style.opacity).toBe("0");
    move(root, 40, 25);
    expect(mark.style.opacity).toBe("1");
    expect(mark.style.transform).toContain("40px");
    fireEvent.pointerLeave(root);
    expect(mark.style.opacity).toBe("0");
  });

  it("stays hidden for touch, isStill, reduced motion and rdm-still", () => {
    const touch = render(<Pointer name="Maya">Canvas</Pointer>);
    touchMove(touch.container.firstElementChild as HTMLElement);
    expect((touch.container.querySelector("[data-rdm-pointer]") as HTMLElement).style.opacity).toBe("0");
    expect(render(<Pointer name="Maya" isStill>Canvas</Pointer>).container.querySelector("[data-rdm-pointer]")).toBeNull();
    mockMotionPreference(true);
    expect(render(<Pointer name="Maya">Canvas</Pointer>).container.querySelector("[data-rdm-pointer]")).toBeNull();
    mockMotionPreference(false);
    const wrapped = render(
      <div className="rdm-still">
        <Pointer name="Maya">Canvas</Pointer>
      </div>,
    );
    const inner = wrapped.container.querySelector(".relative") as HTMLElement;
    move(inner, 5, 5);
    expect((inner.querySelector("[data-rdm-pointer]") as HTMLElement).style.opacity).toBe("0");
  });

  it("has no axe violations and renders on the server", async () => {
    const { container } = render(
      <Pointer name="Maya">
        <button type="button">Press</button>
      </Pointer>,
    );
    expect(await axeViolations(container)).toEqual([]);
    expect(renderToString(<Pointer name="Maya">Server text</Pointer>)).toContain("Server text");
  });
});

const items: FileTreeNode[] = [
  {
    id: "src",
    name: "src",
    children: [
      { id: "index", name: "index.ts", size: "1.2 KB", status: "modified" },
      { id: "logo", name: "logo.png" },
      { id: "notes", name: "notes.md" },
    ],
  },
  { id: "license", name: "LICENSE" },
];

describe("FileTree", () => {
  it("is a named tree with levels and expansion from the Tree", () => {
    render(<FileTree label="Project files" items={items} defaultExpandedKeys={["src"]} />);
    expect(screen.getByRole("treegrid", { name: "Project files" })).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveAttribute("aria-expanded", "true");
    expect(rows[1]).toHaveAttribute("aria-level", "2");
  });

  it("keeps closed folders collapsed, and opens them from the keyboard", async () => {
    const user = userEvent.setup();
    render(<FileTree label="Project files" items={items} />);
    expect(screen.getAllByRole("row")).toHaveLength(2);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getAllByRole("row")).toHaveLength(5);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getAllByRole("row")[2]).toHaveFocus();
  });

  it("selects a row and reports it", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<FileTree label="Files" items={items} defaultExpandedKeys={["src"]} onSelectionChange={onSelectionChange} />);
    await user.click(screen.getByText("logo.png"));
    expect([...onSelectionChange.mock.calls[0][0]]).toEqual(["logo"]);
    expect(screen.getAllByRole("row")[2]).toHaveAttribute("aria-selected", "true");
  });

  it("puts the status and size in the row name and hides the icons and badges", () => {
    const { container } = render(<FileTree label="Files" items={items} defaultExpandedKeys={["src"]} />);
    const row = screen.getByText("index.ts").closest("[role=row]") as HTMLElement;
    expect(row.getAttribute("aria-label") ?? row.textContent).toContain("index.ts");
    expect(row).toHaveTextContent("1.2 KB");
    expect(row).toHaveTextContent("M");
    expect(container.querySelectorAll("svg[aria-hidden=true]").length).toBeGreaterThan(4);
  });

  it("chooses open and closed folder icons by expansion and neutral icons by extension", () => {
    const { container } = render(<FileTree label="Files" items={items} defaultExpandedKeys={["src"]} />);
    const folderRow = screen.getByText("src").closest("[role=row]") as HTMLElement;
    expect(folderRow.className).toContain("group");
    expect(folderRow.querySelectorAll("svg")).toHaveLength(3);
    const shapes = (name: string) => (screen.getByText(name).closest("[role=row]") as HTMLElement).querySelector("svg")!.innerHTML;
    expect(shapes("index.ts")).not.toBe(shapes("LICENSE"));
    expect(shapes("notes.md")).not.toBe(shapes("LICENSE"));
    expect(shapes("logo.png")).not.toBe(shapes("LICENSE"));
    expect(container).toBeTruthy();
  });

  it("has no axe violations and renders on the server", async () => {
    const { container } = render(<FileTree label="Files" items={items} defaultExpandedKeys={["src"]} />);
    expect(await axeViolations(container)).toEqual([]);
    expect(renderToString(<FileTree label="Files" items={items} />)).toContain("LICENSE");
  });
});
