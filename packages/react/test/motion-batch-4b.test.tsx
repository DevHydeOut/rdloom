import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Backlight, IconCloud, OrbitingCircles } from "../src";
import { axeViolations } from "./axe";

function mockMotionPreference(reduce: boolean) {
  const query = {
    matches: reduce,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  vi.stubGlobal("matchMedia", () => query);
}

beforeEach(() => mockMotionPreference(false));
afterEach(() => vi.unstubAllGlobals());

const tiles = ["One", "Two", "Three", "Four", "Five"];

describe("OrbitingCircles", () => {
  const ui = (props = {}) => (
    <OrbitingCircles center={<span>Middle</span>} {...props}>
      {tiles.map((t) => (
        <button key={t}>{t}</button>
      ))}
    </OrbitingCircles>
  );

  it("renders the children as list items in order, each in its own position", () => {
    render(ui());
    const list = screen.getByRole("list", { name: "Orbiting items" });
    const items = list.querySelectorAll("li");
    expect(items).toHaveLength(5);
    expect([...items].map((li) => li.textContent)).toEqual(tiles);
    expect(items[1].style.getPropertyValue("--rdm-a")).toBe("72deg");
    expect(screen.getByText("Middle")).toBeInTheDocument();
  });

  it("draws one aria-hidden path per ring, spreads items over rings, and alternates direction", () => {
    const { container } = render(ui({ rings: 2, reverse: false }));
    const paths = container.querySelectorAll(".rdm-orbit-path");
    expect(paths).toHaveLength(2);
    paths.forEach((p) => expect(p).toHaveAttribute("aria-hidden", "true"));
    const items = container.querySelectorAll(".rdm-orbit-item");
    expect(items[0]).toHaveAttribute("data-reverse");
    expect(items[1]).not.toHaveAttribute("data-reverse");
    expect(items[0].getAttribute("style")).toContain("* 0.25)");
    expect(items[1].getAttribute("style")).toContain("* 0.5)");
  });

  it("hides paths with showPaths=false and reverses with reverse", () => {
    const { container } = render(ui({ showPaths: false, reverse: true }));
    expect(container.querySelector(".rdm-orbit-path")).toBeNull();
    expect(container.querySelector(".rdm-orbit-item")).toHaveAttribute("data-reverse");
  });

  it("pauses with isPaused and marks pause on hover", () => {
    const { container } = render(ui({ isPaused: true, pauseOnHover: true }));
    expect(container.firstElementChild).toHaveAttribute("data-rdm-paused", "true");
    expect(container.firstElementChild).toHaveAttribute("data-pause-hover", "true");
  });

  it("keeps the items in DOM order for the keyboard, also under reduced motion", async () => {
    mockMotionPreference(true);
    render(ui());
    await userEvent.tab();
    expect(screen.getByText("One")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByText("Two")).toHaveFocus();
  });

  it("has the items in server HTML", () => {
    const html = renderToString(ui());
    for (const t of tiles) expect(html).toContain(t);
    expect(html).toContain("--rdm-a:72deg");
  });

  it("has no axe violations", async () => {
    const { container } = render(ui());
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("IconCloud", () => {
  const press = vi.fn();
  const items = [
    { label: "Docs", href: "#docs", icon: <i>D</i> },
    { label: "Run", onPress: press, icon: <i>R</i> },
    { label: "Plain", icon: <i>P</i> },
  ];

  it("renders a list with a link, a button and an image, in a stable order", () => {
    render(<IconCloud items={items} label="Tools" />);
    const list = screen.getByRole("list", { name: "Tools" });
    expect(list.querySelectorAll("li")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "#docs");
    expect(screen.getByRole("button", { name: "Run" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Plain" })).toBeInTheDocument();
  });

  it("reaches links and buttons by keyboard in array order and presses a button", async () => {
    render(<IconCloud items={items} />);
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Run" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(press).toHaveBeenCalledTimes(1);
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });

  it("pauses with isPaused and under reduced motion still renders every item", () => {
    mockMotionPreference(true);
    const { container } = render(<IconCloud items={items} isPaused />);
    expect(container.firstElementChild).toHaveAttribute("data-rdm-paused", "true");
    expect(container.querySelectorAll(".rdm-cloud-item")).toHaveLength(3);
  });

  it("places each item on the sphere with its own angles", () => {
    const { container } = render(<IconCloud items={items} size={200} iconSize={40} />);
    const first = container.querySelector(".rdm-cloud-item") as HTMLElement;
    expect(first.style.getPropertyValue("--rdm-lat")).toBe("90deg");
    expect(container.firstElementChild).toHaveStyle({ width: "200px" });
  });

  it("has the items in server HTML", () => {
    const html = renderToString(<IconCloud items={items} />);
    expect(html).toContain('aria-label="Docs"');
    expect(html).toContain("rdm-cloud-sphere");
  });

  it("has no axe violations", async () => {
    const { container } = render(<IconCloud items={items} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Backlight", () => {
  it("draws a gradient glow from colors, hidden from assistive technology, and shows the content once", () => {
    const { container } = render(
      <Backlight colors={["red", "blue"]}>
        <p>Card</p>
      </Backlight>,
    );
    const glow = container.querySelector(".rdm-backlight-glow")!;
    expect(glow).toHaveAttribute("aria-hidden", "true");
    expect(glow).toHaveAttribute("data-mode", "colors");
    expect(glow.textContent).toBe("");
    expect(screen.getAllByText("Card")).toHaveLength(1);
    expect(container.firstElementChild!.getAttribute("style")).toContain("conic-gradient(from 0deg, red, blue, red)");
  });

  it("uses an inert, hidden copy of the children when there are no colors", () => {
    const { container } = render(
      <Backlight>
        <button>Go</button>
      </Backlight>,
    );
    const glow = container.querySelector(".rdm-backlight-glow")!;
    expect(glow).toHaveAttribute("data-mode", "copy");
    expect(glow).toHaveAttribute("aria-hidden", "true");
    expect(glow.hasAttribute("inert")).toBe(true);
    expect(glow.textContent).toBe("Go");
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("sets intensity, blur and scale, clamps intensity, and stills with isStill", () => {
    const { container } = render(
      <Backlight colors={["red"]} intensity={3} blur={10} scale={1.3} isStill>
        <p>x</p>
      </Backlight>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--rdm-o")).toBe("1");
    expect(root.style.getPropertyValue("--rdm-blur")).toBe("10px");
    expect(root.style.getPropertyValue("--rdm-sc")).toBe("1.3");
    expect(root).toHaveAttribute("data-rdm-paused", "true");
  });

  it("is plain markup that works under reduced motion and on the server", () => {
    mockMotionPreference(true);
    const html = renderToString(
      <Backlight colors={["red"]}>
        <p>Server card</p>
      </Backlight>,
    );
    expect(html).toContain("Server card");
    expect(html).toContain("rdm-backlight-glow");
  });

  it("has no axe violations in either mode", async () => {
    const { container } = render(
      <>
        <Backlight colors={["red"]}>
          <p>A</p>
        </Backlight>
        <Backlight>
          <p>B</p>
        </Backlight>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("rough edges", () => {
  it("Backlight copy mode never repeats an id", () => {
    const { container } = render(
      <Backlight>
        <div id="card">
          <span id="title">Hello</span>
        </div>
      </Backlight>,
    );
    expect(container.querySelectorAll("#card")).toHaveLength(1);
    expect(container.querySelectorAll("#title")).toHaveLength(1);
    expect(container.querySelector(".rdm-backlight-glow")?.textContent).toBe("Hello");
  });

  it("OrbitingCircles sizes its rings as fractions of its own width so it can shrink", () => {
    const { container } = render(
      <OrbitingCircles radius={100} rings={2}>
        <span>a</span>
        <span>b</span>
      </OrbitingCircles>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.width).toBe("236px");
    expect(root.style.height).toBe("");
    expect(container.querySelector<HTMLElement>(".rdm-orbit-path")?.style.width).toContain("100cqw");
  });
});
