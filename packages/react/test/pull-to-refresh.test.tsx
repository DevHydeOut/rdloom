import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PullToRefresh } from "../src";
import { axeViolations } from "./axe";

// jsdom has no touch gestures, so build touch events with the touches we want.
function touch(el: Element, type: "touchstart" | "touchmove" | "touchend" | "touchcancel", x = 100, y = 0, touches = 1) {
  const e = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(e, "touches", { value: Array.from({ length: touches }, () => ({ clientX: x, clientY: y })) });
  fireEvent(el, e);
  return e;
}

/** Pull down by `dy`, optionally sideways by `dx`, then let go. */
function pull(el: Element, dy: number, { dx = 0, release = true }: { dx?: number; release?: boolean } = {}) {
  touch(el, "touchstart", 100, 0);
  touch(el, "touchmove", 100 + dx / 2, dy / 2);
  const last = touch(el, "touchmove", 100 + dx, dy);
  if (release) touch(el, "touchend", 100 + dx, dy);
  return last;
}

const deferred = () => {
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const setup = (props: Partial<React.ComponentProps<typeof PullToRefresh>> = {}) => {
  const onRefresh = props.onRefresh ?? vi.fn(() => Promise.resolve());
  const view = render(
    <PullToRefresh onRefresh={onRefresh} {...props}>
      <p>List content</p>
    </PullToRefresh>,
  );
  const content = screen.getByText("List content").parentElement as HTMLElement;
  const root = content.parentElement as HTMLElement;
  return { ...view, onRefresh, content, root };
};

afterEach(() => vi.restoreAllMocks());

const LONG = 300; // a long pull, well past the threshold
const SHORT = 40; // a short pull, short of it

describe("PullToRefresh", () => {
  it("shows the content and nothing of the indicator at rest", () => {
    const { root } = setup();
    expect(screen.getByText("List content")).toBeInTheDocument();
    expect(root).toHaveAttribute("data-phase", "idle");
    expect(screen.queryByText("Pull to refresh")).not.toBeInTheDocument();
  });

  describe("the pull", () => {
    it("moves the content down and says to pull while short of the line", () => {
      const { root, content } = setup();
      pull(root, SHORT, { release: false });
      expect(root).toHaveAttribute("data-phase", "pulling");
      expect(content.style.transform).toMatch(/translateY\(\d/);
      expect(screen.getByText("Pull to refresh")).toBeInTheDocument();
    });

    it("says to let go once past the line", () => {
      const { root } = setup();
      pull(root, LONG, { release: false });
      expect(root).toHaveAttribute("data-phase", "ready");
      expect(screen.getByText("Release to refresh")).toBeInTheDocument();
    });

    it("stops the browser's own scrolling while pulling", () => {
      const { root } = setup();
      const e = pull(root, SHORT, { release: false });
      expect(e.defaultPrevented).toBe(true);
    });

    it("cancels without loading when let go short of the line", () => {
      const { root, content, onRefresh } = setup();
      pull(root, SHORT);
      expect(onRefresh).not.toHaveBeenCalled();
      expect(root).toHaveAttribute("data-phase", "idle");
      expect(content.style.transform).toBe("");
    });

    it("refreshes when let go past the line", async () => {
      const { root, onRefresh } = setup();
      pull(root, LONG);
      expect(onRefresh).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(root).toHaveAttribute("data-phase", "idle"));
    });

    it("cancels on touchcancel", () => {
      const { root, onRefresh } = setup();
      pull(root, LONG, { release: false });
      touch(root, "touchcancel");
      expect(onRefresh).not.toHaveBeenCalled();
      expect(root).toHaveAttribute("data-phase", "idle");
    });

    it("ignores a tiny movement, so a tap is a tap", () => {
      const { root, onRefresh } = setup();
      touch(root, "touchstart", 100, 0);
      const e = touch(root, "touchmove", 102, 4);
      touch(root, "touchend", 102, 4);
      expect(e.defaultPrevented).toBe(false);
      expect(onRefresh).not.toHaveBeenCalled();
    });

    it("leaves an upward move to the scrolling", () => {
      const { root, onRefresh } = setup();
      const e = pull(root, -200);
      expect(e.defaultPrevented).toBe(false);
      expect(onRefresh).not.toHaveBeenCalled();
    });

    it("leaves a mostly sideways move alone, so a swipe inside the content works", () => {
      const { root, onRefresh } = setup();
      const e = pull(root, 60, { dx: 200 });
      expect(e.defaultPrevented).toBe(false);
      expect(onRefresh).not.toHaveBeenCalled();
    });

    it("ignores a second finger", () => {
      const { root, onRefresh } = setup();
      touch(root, "touchstart", 100, 0, 2);
      touch(root, "touchmove", 100, LONG, 2);
      touch(root, "touchend", 100, LONG, 2);
      expect(onRefresh).not.toHaveBeenCalled();
    });

    it("does not start unless the content is at the top", () => {
      const { root, onRefresh } = setup();
      Object.defineProperty(root, "scrollTop", { value: 120, configurable: true });
      const e = pull(root, LONG);
      expect(e.defaultPrevented).toBe(false);
      expect(onRefresh).not.toHaveBeenCalled();
    });

    it("gives the gesture back if the content scrolled away during the pull", () => {
      const { root, onRefresh, content } = setup();
      touch(root, "touchstart", 100, 0);
      touch(root, "touchmove", 100, 30);
      Object.defineProperty(root, "scrollTop", { value: 50, configurable: true });
      touch(root, "touchmove", 100, LONG);
      touch(root, "touchend", 100, LONG);
      expect(onRefresh).not.toHaveBeenCalled();
      expect(content.style.transform).toBe("");
    });

    it("uses the page's scroll position with scrollElement=window", () => {
      const { root, onRefresh } = setup({ scrollElement: "window" });
      Object.defineProperty(window, "scrollY", { value: 200, configurable: true });
      pull(root, LONG);
      expect(onRefresh).not.toHaveBeenCalled();
      Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
      pull(root, LONG);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("does not pull when disabled, and has no Refresh button", () => {
      const { root, onRefresh } = setup({ isDisabled: true });
      pull(root, LONG);
      expect(onRefresh).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();
    });

    it("takes the threshold from the prop", () => {
      const { root, onRefresh } = setup({ threshold: 20 });
      // 60px of travel is a short pull for the default 72, but past the line when it is 20.
      pull(root, 60);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe("refreshing", () => {
    it("holds a spinner and marks the content busy until the promise settles", async () => {
      const d = deferred();
      const { root, content } = setup({ onRefresh: () => d.promise });
      pull(root, LONG);
      expect(root).toHaveAttribute("data-phase", "refreshing");
      expect(root).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText("Refreshing", { selector: "span:not(.sr-only)" })).toBeInTheDocument();
      expect(content.style.transform).toBe("translateY(72px)");
      await act(async () => d.resolve());
      expect(root).toHaveAttribute("data-phase", "idle");
      expect(root).not.toHaveAttribute("aria-busy");
      expect(content.style.transform).toBe("");
    });

    it("announces refreshing, then the result", async () => {
      const d = deferred();
      const { root } = setup({ onRefresh: () => d.promise });
      pull(root, LONG);
      expect(screen.getByRole("status")).toHaveTextContent("Refreshing");
      await act(async () => d.resolve());
      expect(screen.getByRole("status")).toHaveTextContent("Updated");
    });

    it("does not start a second refresh while one runs, from a pull or the button", async () => {
      const d = deferred();
      const onRefresh = vi.fn(() => d.promise);
      const { root } = setup({ onRefresh });
      pull(root, LONG);
      pull(root, LONG);
      await userEvent.setup().click(screen.getByRole("button", { name: "Refresh" }));
      expect(onRefresh).toHaveBeenCalledTimes(1);
      await act(async () => d.resolve());
    });

    it("works with an onRefresh that is not async", () => {
      const onRefresh = vi.fn();
      const { root } = setup({ onRefresh });
      pull(root, LONG);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("can be pulled again after it finished", async () => {
      const { root, onRefresh } = setup();
      pull(root, LONG);
      await waitFor(() => expect(root).toHaveAttribute("data-phase", "idle"));
      pull(root, LONG);
      expect(onRefresh).toHaveBeenCalledTimes(2);
    });

    it("shows the refreshing state for isRefreshing without running onRefresh", () => {
      const { root, onRefresh, content } = setup({ isRefreshing: true });
      expect(root).toHaveAttribute("data-phase", "refreshing");
      expect(content.style.transform).toBe("translateY(72px)");
      expect(onRefresh).not.toHaveBeenCalled();
    });

    it("does not touch state after it was removed", async () => {
      const d = deferred();
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      const { root, unmount } = setup({ onRefresh: () => d.promise });
      pull(root, LONG);
      unmount();
      await act(async () => d.resolve());
      expect(errors).not.toHaveBeenCalled();
    });
  });

  describe("failure", () => {
    it("shows the message with Try again, announces it and calls onError", async () => {
      const error = new Error("offline");
      const onError = vi.fn();
      const { root, content } = setup({ onRefresh: () => Promise.reject(error), onError });
      pull(root, LONG);
      await waitFor(() => expect(root).toHaveAttribute("data-failed"));
      expect(onError).toHaveBeenCalledWith(error);
      expect(screen.getByRole("status")).toHaveTextContent("Could not refresh");
      expect(screen.getAllByText("Could not refresh").length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
      expect(content.style.transform).toBe("translateY(56px)");
    });

    it("also fails when onRefresh throws at once", async () => {
      const { root } = setup({
        onRefresh: () => {
          throw new Error("sync");
        },
      });
      pull(root, LONG);
      await waitFor(() => expect(root).toHaveAttribute("data-failed"));
    });

    it("tries again from the button and clears the error when it works", async () => {
      const user = userEvent.setup();
      const onRefresh = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
      const { root } = setup({ onRefresh });
      pull(root, LONG);
      await waitFor(() => expect(root).toHaveAttribute("data-failed"));
      await user.click(screen.getByRole("button", { name: "Try again" }));
      await waitFor(() => expect(root).not.toHaveAttribute("data-failed"));
      expect(onRefresh).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("status")).toHaveTextContent("Updated");
    });
  });

  describe("without a pull", () => {
    it("has a named Refresh button that refreshes", async () => {
      const user = userEvent.setup();
      const { onRefresh } = setup();
      await user.click(screen.getByRole("button", { name: "Refresh" }));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("is reached with Tab and runs with Enter and Space", async () => {
      const user = userEvent.setup();
      const { onRefresh } = setup();
      await user.tab();
      expect(screen.getByRole("button", { name: "Refresh" })).toHaveFocus();
      await user.keyboard("{Enter}");
      await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
      await user.keyboard(" ");
      await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(2));
    });

    it("is inactive while refreshing", async () => {
      const d = deferred();
      setup({ onRefresh: () => d.promise });
      await userEvent.setup().click(screen.getByRole("button", { name: "Refresh" }));
      expect(screen.getByRole("button", { name: "Refresh" })).toHaveAttribute("aria-disabled", "true");
      await act(async () => d.resolve());
      expect(screen.getByRole("button", { name: "Refresh" })).not.toHaveAttribute("aria-disabled");
    });
  });

  describe("labels", () => {
    const labels = { pull: "Tira", release: "Suelta", refreshing: "Actualizando", done: "Listo", error: "Falló", retry: "Reintentar", button: "Actualizar" };

    it("takes every word from labels", async () => {
      const d = deferred();
      const { root } = setup({ labels, onRefresh: () => d.promise });
      expect(screen.getByRole("button", { name: "Actualizar" })).toBeInTheDocument();
      pull(root, SHORT, { release: false });
      expect(screen.getByText("Tira")).toBeInTheDocument();
      touch(root, "touchend");
      pull(root, LONG, { release: false });
      expect(screen.getByText("Suelta")).toBeInTheDocument();
      touch(root, "touchend");
      expect(screen.getByRole("status")).toHaveTextContent("Actualizando");
      await act(async () => d.resolve());
      expect(screen.getByRole("status")).toHaveTextContent("Listo");
    });

    it("keeps the other words when only some are given", () => {
      setup({ labels: { button: "Recargar" } });
      expect(screen.getByRole("button", { name: "Recargar" })).toBeInTheDocument();
    });

    it("translates the failure words", async () => {
      const { root } = setup({ labels, onRefresh: () => Promise.reject(new Error("x")) });
      pull(root, LONG);
      await waitFor(() => expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument());
      expect(screen.getByRole("status")).toHaveTextContent("Falló");
    });
  });

  it("works with a controlled list", async () => {
    function Feed() {
      const [items, setItems] = useState(["one"]);
      return (
        <PullToRefresh onRefresh={async () => setItems((all) => [...all, "two"])}>
          <ul>
            {items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </PullToRefresh>
      );
    }
    render(<Feed />);
    const root = screen.getByRole("list").parentElement?.parentElement as HTMLElement;
    pull(root, LONG);
    await waitFor(() => expect(screen.getByText("two")).toBeInTheDocument());
  });

  it("adds className and slot classNames after the built-in ones, and forwards the ref", async () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <PullToRefresh ref={ref} onRefresh={() => Promise.reject(new Error("x"))} className="own" classNames={{ root: "r", indicator: "i", content: "c", button: "b" }}>
        <p>Body</p>
      </PullToRefresh>,
    );
    expect(ref.current).toHaveClass("own", "r");
    expect(ref.current?.querySelector(".i")).not.toBeNull();
    expect(ref.current?.querySelector(".c")).not.toBeNull();
    expect(ref.current?.querySelector(".b")).not.toBeNull();
  });

  it("keeps the scrolling for itself or for the page by scrollElement", () => {
    const { root, rerender } = setup();
    expect(root).toHaveClass("overflow-y-auto", "overscroll-y-contain");
    rerender(
      <PullToRefresh onRefresh={() => {}} scrollElement="window">
        <p>List content</p>
      </PullToRefresh>,
    );
    expect(root).not.toHaveClass("overflow-y-auto");
  });

  it("has no accessibility violations at rest, while pulling, refreshing and after a failure", async () => {
    const d = deferred();
    const { container, root } = setup({ onRefresh: () => d.promise });
    expect(await axeViolations(container)).toEqual([]);
    pull(root, SHORT, { release: false });
    expect(await axeViolations(container)).toEqual([]);
    touch(root, "touchend");
    pull(root, LONG);
    expect(await axeViolations(container)).toEqual([]);
    await act(async () => d.reject(new Error("x")));
    expect(await axeViolations(container)).toEqual([]);
  });
});
