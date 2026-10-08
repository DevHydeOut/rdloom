import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, Spinner } from "../src";
import { axeViolations } from "./axe";

describe("Spinner", () => {
  it("is a status with the default label as text", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("uses a custom label as its name", () => {
    render(<Spinner label="Loading invoices" />);
    expect(screen.getByRole("status", { name: "Loading invoices" })).toBeInTheDocument();
  });

  it("sets the size", () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.querySelector("svg")).toHaveClass("size-8");
  });

  it("stops rotating under reduced motion", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).toHaveClass("motion-reduce:animate-none");
  });

  it("is hidden from assistive technology when decorative", () => {
    const { container } = render(<Spinner decorative label="ignored" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container).not.toHaveTextContent("ignored");
  });

  it("merges className and forwards the ref", () => {
    let node: HTMLSpanElement | null = null;
    render(<Spinner className="extra" ref={(n) => (node = n)} />);
    expect(node).toHaveClass("extra");
  });

  it("has no axe violations alone or inside a button", async () => {
    const { container } = render(
      <div>
        <Spinner />
        <Button isDisabled>
          <Spinner decorative size="sm" />
          Saving
        </Button>
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
