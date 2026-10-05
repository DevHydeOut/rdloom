import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Alert, Avatar, Badge, Card, Progress, Skeleton, initialsOf } from "../src";
import { axeViolations } from "./axe";

describe("Badge", () => {
  it("is plain inline text with the status in words", () => {
    render(<Badge variant="danger">Overdue</Badge>);
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("takes extra attributes and a class", () => {
    render(
      <Badge className="extra" data-testid="b">
        Draft
      </Badge>,
    );
    expect(screen.getByTestId("b")).toHaveClass("extra");
  });

  it("renders on the server with no client code", () => {
    expect(renderToString(<Badge variant="success">Paid</Badge>)).toContain("Paid");
  });

  it("has no axe violations in any tone", async () => {
    const { container } = render(
      <>
        {(["neutral", "info", "success", "warning", "danger"] as const).map((v) => (
          <Badge key={v} variant={v}>
            {v}
          </Badge>
        ))}
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Alert", () => {
  it("interrupts for warnings and errors, and waits its turn for the rest", () => {
    const { rerender } = render(<Alert variant="danger">Failed</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    rerender(<Alert variant="warning">Careful</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    rerender(<Alert variant="info">FYI</Alert>);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<Alert variant="success">Done</Alert>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("says its tone in words, not just color and an icon", () => {
    render(
      <Alert variant="warning" title="Storage">
        Almost full
      </Alert>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Warning: Storage");
  });

  it.each([
    ["info", "Information"],
    ["success", "Success"],
    ["danger", "Error"],
  ] as const)("a %s alert says %s", (variant, word) => {
    render(<Alert variant={variant}>Message</Alert>);
    expect(screen.getByRole(variant === "danger" ? "alert" : "status")).toHaveTextContent(`${word}: Message`);
  });

  it("has no close button unless onDismiss is given", () => {
    render(<Alert>Message</Alert>);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("dismisses with the button, from the keyboard too", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Alert onDismiss={onDismiss}>Message</Alert>);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onDismiss).toHaveBeenCalledTimes(1);
    screen.getByRole("button", { name: "Dismiss" }).focus();
    await user.keyboard("{Enter}");
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it("lets you rename the close button, for other languages", () => {
    render(
      <Alert onDismiss={() => {}} dismissLabel="Schließen">
        Nachricht
      </Alert>,
    );
    expect(screen.getByRole("button", { name: "Schließen" })).toBeInTheDocument();
  });

  it("hides its icon from assistive technology", () => {
    const { container } = render(<Alert>Message</Alert>);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no axe violations in any tone, with and without a close button", async () => {
    const { container } = render(
      <>
        {(["info", "success", "warning", "danger"] as const).map((v) => (
          <Alert key={v} variant={v} title="Title" onDismiss={() => {}}>
            Message
          </Alert>
        ))}
        <Alert>Plain</Alert>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Card", () => {
  it("is a group named by its title, with the title as a heading", () => {
    render(
      <Card title="Team plan" description="Up to 10 members">
        Body
      </Card>,
    );
    expect(screen.getByRole("group", { name: "Team plan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Team plan", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Up to 10 members")).toBeInTheDocument();
  });

  it("uses the heading level you choose, kept between 2 and 6", () => {
    const { rerender } = render(
      <Card title="T" headingLevel={2}>
        x
      </Card>,
    );
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    rerender(
      <Card title="T" headingLevel={9}>
        x
      </Card>,
    );
    expect(screen.getByRole("heading", { level: 6 })).toBeInTheDocument();
    rerender(
      <Card title="T" headingLevel={1}>
        x
      </Card>,
    ); // never a second h1
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("without a title it is a plain container, not a group", () => {
    render(<Card>Just content</Card>);
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("shows a footer", () => {
    render(
      <Card title="T" footer={<button>Save</button>}>
        x
      </Card>,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("gives every card its own heading id", () => {
    render(
      <>
        <Card title="One">a</Card>
        <Card title="Two">b</Card>
      </>,
    );
    expect(screen.getByRole("group", { name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Two" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <Card title="Outlined" variant="outlined" footer={<button>Go</button>}>
          a
        </Card>
        <Card title="Raised" variant="raised" description="d">
          b
        </Card>
        <Card variant="subtle">c</Card>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Avatar", () => {
  it("takes initials from the first and last word of the name", () => {
    expect(initialsOf("Ada Lovelace")).toBe("AL");
    expect(initialsOf("Grace Brewster Murray Hopper")).toBe("GH");
    expect(initialsOf("Linus")).toBe("L");
    expect(initialsOf("  ada   lovelace  ")).toBe("AL");
    expect(initialsOf("")).toBe("");
    expect(initialsOf("   ")).toBe("");
  });

  it("keeps whole characters: emoji and non-Latin names", () => {
    expect(initialsOf("😀 Smile")).toBe("😀S");
    expect(initialsOf("王 小明")).toBe("王小");
  });

  it("without an image it is an image role named after the person", () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByText("AL")).toHaveAttribute("aria-hidden", "true"); // the letters aren't read separately
  });

  it("with an image, the image carries the name", () => {
    render(<Avatar name="Ada Lovelace" src="/ada.png" />);
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveAttribute("src", "/ada.png");
    expect(screen.queryByText("AL")).toBeNull();
  });

  it("falls back to initials when the image fails to load, and tries a new image again", () => {
    const { rerender } = render(<Avatar name="Ada Lovelace" src="/broken.png" />);
    fireEvent.error(screen.getByRole("img", { name: "Ada Lovelace" }));
    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Ada Lovelace" })).toHaveLength(1);
    rerender(<Avatar name="Ada Lovelace" src="/fixed.png" />);
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveAttribute("src", "/fixed.png");
  });

  it("can be decorative, so a name written beside it isn't read twice", () => {
    const { container } = render(
      <>
        <Avatar name="Ada Lovelace" decorative />
        <Avatar name="Ada Lovelace" src="/ada.png" decorative />
      </>,
    );
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" src="/g.png" size="lg" shape="square" />
        <Avatar name="Linus" decorative />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Progress", () => {
  it("is a named progress bar with its value", () => {
    render(<Progress label="Uploading" value={64} />);
    const bar = screen.getByRole("progressbar", { name: "Uploading" });
    expect(bar).toHaveAttribute("aria-valuenow", "64");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("64%")).toBeInTheDocument();
  });

  it("sets the fill from the value", () => {
    const { container } = render(<Progress label="Uploading" value={25} minValue={0} maxValue={50} />);
    expect(container.querySelector<HTMLElement>(".h-full")!.style.width).toBe("50%");
  });

  it("can show its own words instead of a percentage", () => {
    render(<Progress label="Files" value={3} maxValue={10} valueLabel="3 of 10 files" />);
    expect(screen.getByText("3 of 10 files")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "3 of 10 files");
  });

  it("can hide the number", () => {
    render(<Progress label="Uploading" value={64} showValue={false} />);
    expect(screen.queryByText("64%")).toBeNull();
  });

  it("indeterminate has no value to report", () => {
    render(<Progress label="Preparing" isIndeterminate />);
    const bar = screen.getByRole("progressbar", { name: "Preparing" });
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("stops the pulse for people who prefer reduced motion", () => {
    const { container } = render(<Progress label="Preparing" isIndeterminate />);
    expect(container.querySelector(".animate-pulse")).toHaveClass("motion-reduce:animate-none");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <Progress label="One" value={10} />
        <Progress label="Two" isIndeterminate variant="warning" size="sm" />
        <Progress label="Three" value={100} variant="success" valueLabel="Done" />
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Skeleton", () => {
  it("is silent: hidden from assistive technology", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("draws the number of text lines, with a shorter last line", () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    const lines = container.querySelectorAll<HTMLElement>("[style*='height']");
    expect(lines).toHaveLength(3);
    expect([...lines].map((l) => l.style.width)).toEqual(["100%", "100%", "60%"]);
  });

  it("a single text line is full width", () => {
    const { container } = render(<Skeleton variant="text" />);
    expect(container.querySelector<HTMLElement>("[style*='height']")!.style.width).toBe("100%");
  });

  it("a circle is as wide as it is tall, numbers are pixels", () => {
    const { container } = render(<Skeleton variant="circle" width={48} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe("48px");
    expect(el.style.height).toBe("48px");
    expect(el).toHaveClass("rounded-full");
  });

  it("a rect takes CSS lengths", () => {
    const { container } = render(<Skeleton width="60%" height={120} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe("60%");
    expect(el.style.height).toBe("120px");
  });

  it("stops pulsing for people who prefer reduced motion", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveClass("animate-pulse", "motion-reduce:animate-none");
  });

  it("renders on the server with no client code", () => {
    expect(renderToString(<Skeleton variant="text" lines={2} />)).toContain("aria-hidden");
  });

  it("has no axe violations inside a loading region", async () => {
    const { container } = render(
      <div aria-busy="true">
        <span role="status" className="sr-only">
          Loading
        </span>
        <Skeleton variant="circle" />
        <Skeleton variant="text" lines={2} />
        <Skeleton />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
