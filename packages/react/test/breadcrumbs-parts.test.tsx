import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BreadcrumbEllipsis, BreadcrumbItem, Breadcrumbs, HomeIcon } from "../src";
import { axeViolations } from "./axe";

const collapsed = (
  <Breadcrumbs>
    <BreadcrumbItem href="/">Home</BreadcrumbItem>
    <BreadcrumbEllipsis
      items={[
        { label: "Documentation", href: "/docs" },
        { label: "Components", href: "/docs/components" },
      ]}
    />
    <BreadcrumbItem href="/docs/components/forms">Forms</BreadcrumbItem>
    <BreadcrumbItem>Number field</BreadcrumbItem>
  </Breadcrumbs>
);

describe("Breadcrumbs: separator, icon and collapsed trail", () => {
  it("uses a slash when asked and hides it from screen readers", () => {
    const { container } = render(
      <Breadcrumbs separator="slash">
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem>Billing</BreadcrumbItem>
      </Breadcrumbs>,
    );
    const mark = container.querySelector("li [aria-hidden='true']");
    expect(mark?.textContent).toBe("/");
  });

  it("takes a custom separator for one item", () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem href="/" separator={<span data-testid="dot" />}>
          Home
        </BreadcrumbItem>
        <BreadcrumbItem>Billing</BreadcrumbItem>
      </Breadcrumbs>,
    );
    expect(screen.getByTestId("dot").closest("[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByTestId("dot").closest("li")?.querySelector("svg")).toBeNull();
  });

  it("keeps the text as the name when an icon is added", () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem href="/" icon={<HomeIcon />}>
          Home
        </BreadcrumbItem>
        <BreadcrumbItem>Billing</BreadcrumbItem>
      </Breadcrumbs>,
    );
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("opens the hidden steps from a named button as links", async () => {
    const user = userEvent.setup();
    render(collapsed);
    const button = screen.getByRole("button", { name: "Show hidden pages" });
    await user.click(button);
    const menu = await screen.findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Documentation", "Components"]);
    expect(items[0]).toHaveAttribute("href", "/docs");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(button).toHaveFocus());
  });

  it("still marks the last item as the current page", () => {
    render(collapsed);
    expect(screen.getByText("Number field").closest("[aria-current='page']")).not.toBeNull();
  });

  it("has no axe violations when collapsed", async () => {
    const { container } = render(collapsed);
    expect(await axeViolations(container)).toEqual([]);
  });
});
