import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Attachment, AttachmentList, Bubble, BubbleGroup, BubbleList } from "../src";
import { axeViolations } from "./axe";

describe("Bubble", () => {
  it("is an article named by its sender", () => {
    render(
      <>
        <Bubble name="Alex">Hello</Bubble>
        <Bubble from="user">Hi</Bubble>
      </>,
    );
    expect(screen.getByRole("article", { name: "Alex message" })).toHaveTextContent("Hello");
    expect(screen.getByRole("article", { name: "You message" })).toHaveAttribute("data-from", "user");
  });

  it("renders the time as a time element", () => {
    render(
      <Bubble timestamp="2026-10-08T10:42:00" timestampText="10:42">
        Hello
      </Bubble>,
    );
    const time = screen.getByText("10:42");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-10-08T10:42:00");
  });

  it("shows a sending status", () => {
    render(<Bubble status="sending">Hello</Bubble>);
    expect(screen.getByRole("status")).toHaveTextContent("Sending");
  });

  it("announces a failure and retries by mouse and keyboard", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <Bubble from="user" status="failed" onRetry={onRetry}>
        Hello
      </Bubble>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Not sent");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    screen.getByRole("button", { name: "Retry" }).focus();
    await user.keyboard("{Enter}");
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it("has no Retry button without onRetry", () => {
    render(<Bubble status="failed">Hello</Bubble>);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("puts actions in the footer", () => {
    render(<Bubble actions={<button type="button">Copy</button>}>Hello</Bubble>);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("sets positions in a group and merges corners with logical classes", () => {
    render(
      <BubbleGroup aria-label="From Alex">
        <Bubble name="Alex">One</Bubble>
        <Bubble name="Alex">Two</Bubble>
        <Bubble name="Alex">Three</Bubble>
      </BubbleGroup>,
    );
    const articles = screen.getAllByRole("article");
    expect(articles.map((a) => a.getAttribute("data-position"))).toEqual(["first", "middle", "last"]);
    expect(screen.getByRole("group", { name: "From Alex" })).toBeInTheDocument();
    expect(articles[1].innerHTML).toMatch(/rounded-ss-md/);
    expect(articles[1].innerHTML).toMatch(/rounded-es-md/);
    // Name only on the first bubble of a run.
    expect(screen.getAllByText("Alex")).toHaveLength(1);
  });

  it("shows attachments inside the bubble", () => {
    render(
      <Bubble
        attachments={
          <AttachmentList aria-label="Files">
            <Attachment name="a.pdf" />
          </AttachmentList>
        }
      >
        See file
      </Bubble>,
    );
    expect(screen.getByRole("list", { name: "Files" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <div>
        <BubbleGroup aria-label="Alex">
          <Bubble name="Alex" avatar={<span aria-hidden="true">A</span>}>
            One
          </Bubble>
          <Bubble name="Alex" timestamp="2026-10-08T10:00:00" timestampText="10:00">
            Two
          </Bubble>
        </BubbleGroup>
        <Bubble from="user" status="failed" onRetry={() => {}}>
          Hello
        </Bubble>
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("BubbleList", () => {
  it("is a list with one item per bubble or group and no axe violations", async () => {
    render(
      <BubbleList aria-label="Chat">
        <Bubble from="user">One</Bubble>
        <BubbleGroup aria-label="Alex">
          <Bubble>Two</Bubble>
          <Bubble>Three</Bubble>
        </BubbleGroup>
      </BubbleList>,
    );
    expect(screen.getByRole("list", { name: "Chat" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(await axeViolations()).toEqual([]);
  });
});
