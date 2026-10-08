import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Marker } from "../src";
import { axeViolations } from "./axe";

describe("Marker", () => {
  it("is a separator named by its label", () => {
    render(<Marker label="Today" />);
    expect(screen.getByRole("separator", { name: "Today" })).toBeInTheDocument();
  });

  it("renders a time element when given dateTime", () => {
    render(<Marker label="Today" dateTime="2026-10-08" />);
    expect(screen.getByText("Today").tagName).toBe("TIME");
  });

  it("styles the unread variant in the action colour", () => {
    render(<Marker variant="unread" label="New messages" />);
    expect(screen.getByRole("separator").innerHTML).toMatch(/rd-color-action-primary/);
  });

  it("jumps from a real button, by mouse and keyboard", async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    render(<Marker variant="unread" label="New messages" onJump={onJump} />);
    expect(screen.queryByRole("separator")).toBeNull();
    await user.click(screen.getByRole("button", { name: "New messages" }));
    screen.getByRole("button", { name: "New messages" }).focus();
    await user.keyboard("{Enter}");
    expect(onJump).toHaveBeenCalledTimes(2);
  });

  it("uses jumpLabel as the button name", () => {
    render(<Marker variant="unread" label="New messages" jumpLabel="Jump to first new message" onJump={() => {}} />);
    expect(screen.getByRole("button", { name: "Jump to first new message" })).toBeInTheDocument();
  });

  it("ignores onJump for date and event markers", () => {
    render(<Marker variant="event" label="Alex joined" onJump={() => {}} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("separator", { name: "Alex joined" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <div>
        <Marker label="Today" dateTime="2026-10-08" />
        <Marker variant="unread" label="New messages" onJump={() => {}} />
        <Marker variant="event" label="Alex joined" />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
