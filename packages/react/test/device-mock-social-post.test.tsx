import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DeviceMock, SocialPostCard } from "../src";
import { axeViolations } from "./axe";

describe("DeviceMock", () => {
  it.each(["phone", "tablet", "laptop", "desktop", "watch", "browser"] as const)("renders %s with real children and decorative frame", (device) => {
    const { container } = render(
      <DeviceMock device={device} label="Preview">
        <h2>Inside</h2>
        <button type="button">Go</button>
      </DeviceMock>,
    );
    expect(screen.getByRole("group", { name: "Preview" })).toHaveAttribute("data-device", device);
    expect(screen.getByRole("heading", { name: "Inside" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it("has no group role without a label", () => {
    render(<DeviceMock>x</DeviceMock>);
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("applies orientation to phone and tablet only", () => {
    const { rerender } = render(<DeviceMock device="phone" orientation="landscape">x</DeviceMock>);
    expect(document.querySelector(".rd-device-mock")).toHaveAttribute("data-orientation", "landscape");
    rerender(<DeviceMock device="laptop" orientation="landscape">x</DeviceMock>);
    expect(document.querySelector(".rd-device-mock")).toHaveAttribute("data-orientation", "portrait");
  });

  it("supports light and dark tone", () => {
    const { rerender } = render(<DeviceMock tone="light">x</DeviceMock>);
    expect(document.querySelector(".rd-device-mock")).toHaveAttribute("data-tone", "light");
    rerender(<DeviceMock tone="dark">x</DeviceMock>);
    expect(document.querySelector(".rd-device-mock")).toHaveAttribute("data-tone", "dark");
  });

  it("has no axe violations and renders on the server", async () => {
    const { container } = render(
      <DeviceMock device="browser" label="Preview">
        <p>Body</p>
      </DeviceMock>,
    );
    expect(await axeViolations(container)).toEqual([]);
    expect(renderToString(<DeviceMock>Body text</DeviceMock>)).toContain("Body text");
  });
});

describe("SocialPostCard", () => {
  const post = (extra = {}) => (
    <SocialPostCard
      name="Ada Example"
      handle="ada"
      timestamp="2h"
      dateTime="2026-03-12T10:00:00Z"
      replyCount={1}
      repostCount={1840}
      likeCount={12345}
      onReply={() => undefined}
      onRepost={() => undefined}
      onLike={() => undefined}
      {...extra}
    >
      Hello there
    </SocialPostCard>
  );

  it("is an article named by the author with a time element", () => {
    render(post());
    expect(screen.getByRole("article", { name: "Ada Example" })).toBeInTheDocument();
    expect(screen.getByText("@ada")).toBeInTheDocument();
    expect(screen.getByText("2h").tagName).toBe("TIME");
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("formats counts with the locale and keeps the full number in the name", () => {
    render(post({ locale: "en-US" }));
    expect(screen.getByRole("button", { name: "Reply, 1 reply" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Repost, 1,840 reposts" })).toHaveTextContent("1.8K");
    expect(screen.getByRole("button", { name: "Like, 12,345 likes" })).toHaveTextContent("12.3K");
  });

  it("exposes pressed state and fires handlers by mouse and keyboard", async () => {
    const onLike = vi.fn();
    render(post({ isLiked: true, onLike }));
    const like = screen.getByRole("button", { name: /^Like/ });
    expect(like).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(like);
    like.focus();
    await userEvent.keyboard("{Enter}");
    expect(onLike).toHaveBeenCalledTimes(2);
  });

  it("only draws buttons that have handlers, and renders slots", () => {
    render(
      <SocialPostCard name="Lin" media={<div data-testid="m" />} linkPreview={<div data-testid="l" />}>
        Hi
      </SocialPostCard>,
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByTestId("m")).toBeInTheDocument();
    expect(screen.getByTestId("l")).toBeInTheDocument();
  });

  it("supports the compact variant, axe and the server", async () => {
    const { container } = render(post({ variant: "compact" }));
    expect(screen.getByRole("article")).toHaveAttribute("data-variant", "compact");
    expect(await axeViolations(container)).toEqual([]);
    expect(renderToString(post())).toContain("Hello there");
  });
});
