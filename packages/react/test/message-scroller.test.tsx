import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessageScroller, isNearBottom } from "../src";
import { axeViolations } from "./axe";

function sizes(el: HTMLElement, { scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number }) {
  Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, get: () => clientHeight });
}

describe("isNearBottom", () => {
  it("is true at and near the end, false further up", () => {
    expect(isNearBottom({ scrollHeight: 1000, scrollTop: 600, clientHeight: 400 }, 10)).toBe(true);
    expect(isNearBottom({ scrollHeight: 1000, scrollTop: 560, clientHeight: 400 }, 50)).toBe(true);
    expect(isNearBottom({ scrollHeight: 1000, scrollTop: 400, clientHeight: 400 }, 50)).toBe(false);
  });
  it("is true when nothing overflows", () => {
    expect(isNearBottom({ scrollHeight: 300, scrollTop: 0, clientHeight: 300 })).toBe(true);
  });
});

describe("MessageScroller", () => {
  it("is a focusable, polite log with a name", () => {
    render(<MessageScroller label="Support chat">Hello</MessageScroller>);
    const log = screen.getByRole("log", { name: "Support chat" });
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log).toHaveAttribute("tabindex", "0");
  });

  it("has no axe violations", async () => {
    render(<MessageScroller unreadCount={2}>Hello</MessageScroller>);
    expect(await axeViolations()).toEqual([]);
  });

  it("follows new content while at the bottom", () => {
    const { rerender } = render(<MessageScroller>one</MessageScroller>);
    const log = screen.getByRole("log");
    sizes(log, { scrollHeight: 900, clientHeight: 300 });
    rerender(<MessageScroller>one two</MessageScroller>);
    expect(log.scrollTop).toBe(900);
  });

  it("does not move the reader who scrolled up, and offers Jump to latest with the unread count", () => {
    const { rerender } = render(<MessageScroller unreadCount={0}>one</MessageScroller>);
    const log = screen.getByRole("log");
    sizes(log, { scrollHeight: 900, clientHeight: 300 });
    log.scrollTop = 200;
    fireEvent.scroll(log);
    expect(screen.getByRole("button", { name: "Jump to latest" })).toBeInTheDocument();
    sizes(log, { scrollHeight: 1100, clientHeight: 300 });
    rerender(<MessageScroller unreadCount={3}>one two</MessageScroller>);
    expect(log.scrollTop).toBe(200);
    expect(screen.getByRole("button", { name: /Jump to latest\s*, 3 new messages/ })).toBeInTheDocument();
  });

  it("jumps to the end, reports it and hides the button", async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    const onBottom = vi.fn();
    render(
      <MessageScroller onJumpToLatest={onJump} onAtBottomChange={onBottom}>
        one
      </MessageScroller>,
    );
    const log = screen.getByRole("log");
    sizes(log, { scrollHeight: 900, clientHeight: 300 });
    log.scrollTop = 100;
    fireEvent.scroll(log);
    expect(onBottom).toHaveBeenLastCalledWith(false);
    await user.click(screen.getByRole("button", { name: "Jump to latest" }));
    expect(log.scrollTop).toBe(900);
    expect(onJump).toHaveBeenCalledTimes(1);
    expect(onBottom).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole("button", { name: /Jump to latest/ })).toBeNull();
  });

  it("calls onReachTop once at the top and keeps the position when older content is added", () => {
    const onReachTop = vi.fn();
    const { rerender } = render(<MessageScroller onReachTop={onReachTop}>old</MessageScroller>);
    const log = screen.getByRole("log");
    sizes(log, { scrollHeight: 900, clientHeight: 300 });
    log.scrollTop = 500;
    fireEvent.scroll(log);
    log.scrollTop = 0;
    fireEvent.scroll(log);
    fireEvent.scroll(log);
    expect(onReachTop).toHaveBeenCalledTimes(1);
    sizes(log, { scrollHeight: 1400, clientHeight: 300 });
    act(() => {
      rerender(<MessageScroller onReachTop={onReachTop}>older old</MessageScroller>);
    });
    expect(log.scrollTop).toBe(500);
  });

  it("does not ask for more while loading and says so", () => {
    const onReachTop = vi.fn();
    render(
      <MessageScroller onReachTop={onReachTop} isLoadingOlder>
        x
      </MessageScroller>,
    );
    const log = screen.getByRole("log");
    log.scrollTop = 0;
    fireEvent.scroll(log);
    expect(onReachTop).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Loading older messages");
  });
});
