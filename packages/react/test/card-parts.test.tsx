import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  Button,
  Card,
  CardActions,
  CardBand,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardIconButton,
  CardMedia,
  CardMeta,
  CardMetaItem,
  CardOverlay,
  CardTitle,
  HeartIcon,
  TagIcon,
} from "../src";
import { axeViolations } from "./axe";

describe("Card parts", () => {
  it("names the card by a CardTitle part and keeps the heading level", () => {
    render(
      <Card headingLevel={2}>
        <CardHeader>
          <CardTitle>San Francisco</CardTitle>
          <CardDescription>Premium economy</CardDescription>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByRole("group", { name: "San Francisco" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "San Francisco", level: 2 })).toBeInTheDocument();
  });

  it("lets a title part override the level", () => {
    render(
      <Card>
        <CardTitle level={4}>Small</CardTitle>
      </Card>,
    );
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
  });

  it("renders the meta as a list with decorative icons", () => {
    render(
      <CardMeta aria-label="Trip">
        <CardMetaItem icon={<TagIcon />}>from $120</CardMetaItem>
        <CardMetaItem>JFK</CardMetaItem>
      </CardMeta>,
    );
    expect(screen.getByRole("list", { name: "Trip" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(document.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("exports the footer part and the old footer prop still works", () => {
    render(
      <>
        <Card title="A" footer={<button>One</button>}>
          x
        </Card>
        <CardFooter data-testid="f">
          <button>Two</button>
        </CardFooter>
      </>,
    );
    expect(screen.getByRole("button", { name: "One" })).toBeInTheDocument();
    expect(screen.getByTestId("f")).toHaveClass("border-t");
  });

  it("applies the new variant, radius and padding options", () => {
    render(
      <Card data-testid="c" variant="floating" rounded="large" padding="none">
        x
      </Card>,
    );
    const card = screen.getByTestId("c");
    expect(card.className).toContain("--rd-elevation-floating");
    expect(card.className).toContain("--rd-radius-media");
    expect(card.className).toContain("p-0");
  });
});

describe("CardMedia", () => {
  it("shows an image with the alt text", () => {
    render(
      <Card>
        <CardMedia src="/a.jpg" alt="A bridge at sunset" />
      </Card>,
    );
    expect(screen.getByRole("img", { name: "A bridge at sunset" })).toHaveAttribute("src", "/a.jpg");
  });

  it("gives a decorative image an empty alt", () => {
    const { container } = render(
      <Card>
        <CardMedia src="/a.jpg" decorative />
      </Card>,
    );
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("exposes drawn art as a named image, or hides it when decorative", () => {
    const { unmount } = render(<CardMedia alt="Gradient sky" style={{ background: "linear-gradient(red, blue)" }} />);
    expect(screen.getByRole("img", { name: "Gradient sky" })).toBeInTheDocument();
    unmount();
    const { container } = render(<CardMedia decorative />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).not.toHaveAttribute("role");
  });

  it("fills the whole card in the overlay layout and keeps the text on a scrim", () => {
    const { container } = render(
      <Card layout="overlay" data-testid="c">
        <CardMedia alt="Skyline" />
        <CardOverlay tone="dark">
          <CardTitle>New York</CardTitle>
          <CardDescription>Economy</CardDescription>
        </CardOverlay>
      </Card>,
    );
    expect(screen.getByRole("img", { name: "Skyline" })).toHaveClass("absolute", "inset-0");
    expect(screen.getByText("New York").closest("div")).toHaveClass("text-white");
    expect(screen.getByText("Economy")).toHaveClass("text-white/80");
    expect(container.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThanOrEqual(2);
    expect(container.innerHTML).toContain("--rd-color-overlay-backdrop");
  });

  it("uses default text colours on the light overlay", () => {
    render(
      <Card layout="overlay">
        <CardMedia decorative />
        <CardOverlay tone="light">
          <CardDescription>Bio</CardDescription>
        </CardOverlay>
      </Card>,
    );
    expect(screen.getByText("Bio")).toHaveClass("text-[var(--rd-color-text-muted)]");
  });
});

describe("CardIconButton and actions", () => {
  it("is a named button that works with Enter and Space", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Card>
        <CardActions>
          <Button>Search flight</Button>
          <CardIconButton label="Save New York" onPress={onPress}>
            <HeartIcon />
          </CardIconButton>
        </CardActions>
      </Card>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Search flight" })).toHaveFocus();
    await user.tab();
    const save = screen.getByRole("button", { name: "Save New York" });
    expect(save).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("renders the band and body", () => {
    render(
      <Card padding="none">
        <CardBody>Body</CardBody>
        <CardBand tone="lilac">Posted 2 days ago</CardBand>
      </Card>,
    );
    expect(screen.getByText("Posted 2 days ago")).toHaveClass("-mt-6");
  });
});

describe("Card parts, accessibility and server rendering", () => {
  it("has no axe violations across the variants", async () => {
    const { container } = render(
      <>
        <Card layout="overlay" rounded="large">
          <CardMedia alt="Skyline" />
          <CardOverlay>
            <CardTitle>New York</CardTitle>
            <CardIconButton label="Save" tone="frosted">
              <HeartIcon />
            </CardIconButton>
          </CardOverlay>
        </Card>
        <Card padding="none" variant="floating">
          <CardBody>
            <CardTitle>Job</CardTitle>
            <CardMeta>
              <CardMetaItem>FULL TIME</CardMetaItem>
            </CardMeta>
          </CardBody>
          <CardBand>Posted today</CardBand>
        </Card>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders on the server without a window", () => {
    const html = renderToString(
      <Card layout="overlay">
        <CardMedia alt="Skyline" />
        <CardOverlay>
          <CardTitle>New York</CardTitle>
        </CardOverlay>
      </Card>,
    );
    expect(html).toContain("New York");
    expect(html).toContain('aria-label="Skyline"');
  });
});
