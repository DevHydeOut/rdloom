import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Carousel, CarouselItem, ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../src";
import { axeViolations } from "./axe";

const slides = (n = 5) =>
  Array.from({ length: n }, (_, i) => (
    <CarouselItem key={i}>
      <a href={`#s${i}`}>Link {i + 1}</a>
    </CarouselItem>
  ));

describe("Carousel", () => {
  it("is a named carousel region with slides named 'n of total'", () => {
    render(<Carousel label="Stories">{slides()}</Carousel>);
    const region = screen.getByRole("region", { name: "Stories" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    const groups = screen.getAllByRole("group", { hidden: true }).filter((g) => g.getAttribute("aria-roledescription") === "slide");
    expect(groups.map((g) => g.getAttribute("aria-label"))).toEqual(["1 of 5", "2 of 5", "3 of 5", "4 of 5", "5 of 5"]);
  });

  it("makes slides that are out of view inert so Tab skips their links", () => {
    render(<Carousel label="Stories">{slides()}</Carousel>);
    expect(screen.getByRole("link", { name: "Link 1" }).closest("[data-slide]")).not.toHaveAttribute("inert");
    expect(screen.getByRole("link", { name: "Link 2" }).closest("[data-slide]")).toHaveAttribute("inert");
    expect(document.querySelectorAll("[inert]")).toHaveLength(4);
  });

  it("moves with Next and Previous and stops at the ends without losing focus", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(
      <Carousel label="Stories" onIndexChange={onIndexChange}>
        {slides(3)}
      </Carousel>,
    );
    const prev = screen.getByRole("button", { name: "Previous slide" });
    const next = screen.getByRole("button", { name: "Next slide" });
    expect(prev).toHaveAttribute("aria-disabled", "true");
    await user.click(next);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    await user.click(next);
    expect(next).toHaveAttribute("aria-disabled", "true");
    await user.click(next);
    expect(onIndexChange).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("link", { name: "Link 3" })).toBeInTheDocument();
  });

  it("loops from the last slide to the first", async () => {
    const user = userEvent.setup();
    render(
      <Carousel label="Stories" loop defaultIndex={2}>
        {slides(3)}
      </Carousel>,
    );
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByRole("link", { name: "Link 1" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByRole("link", { name: "Link 3" })).toBeInTheDocument();
  });

  it("uses arrow keys, Home and End when the carousel has focus", async () => {
    const user = userEvent.setup();
    render(<Carousel label="Stories">{slides(4)}</Carousel>);
    screen.getByRole("region").focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("link", { name: "Link 3" })).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("link", { name: "Link 2" })).toBeInTheDocument();
    await user.keyboard("{End}");
    expect(screen.getByRole("link", { name: "Link 4" })).toBeInTheDocument();
    await user.keyboard("{Home}");
    expect(screen.getByRole("link", { name: "Link 1" })).toBeInTheDocument();
  });

  it("uses Up and Down when vertical", async () => {
    const user = userEvent.setup();
    render(
      <Carousel label="Notes" orientation="vertical">
        {slides(3)}
      </Carousel>,
    );
    screen.getByRole("region").focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: "Link 2" })).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("link", { name: "Link 2" })).toBeInTheDocument();
  });

  it("has dots named 'Go to slide n' and marks the current one", async () => {
    const user = userEvent.setup();
    render(<Carousel label="Stories">{slides(4)}</Carousel>);
    await user.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(screen.getByRole("button", { name: "Go to slide 3" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Go to slide 1" })).not.toHaveAttribute("aria-current");
  });

  it("can hide the arrows and the dots", () => {
    render(
      <Carousel label="Stories" showArrows={false} showDots={false}>
        {slides(3)}
      </Carousel>,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("announces a change the person made, politely", async () => {
    const user = userEvent.setup();
    render(<Carousel label="Stories">{slides(5)}</Carousel>);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(status).toHaveTextContent("Slide 2 of 5");
  });

  it("works controlled", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [i, setI] = useState(2);
      return (
        <Carousel label="Stories" index={i} onIndexChange={setI}>
          {slides(4)}
        </Carousel>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("link", { name: "Link 3" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByRole("link", { name: "Link 2" })).toBeInTheDocument();
  });

  it("shows several slides at once", () => {
    render(
      <Carousel label="Stories" slidesPerView={2}>
        {slides(5)}
      </Carousel>,
    );
    expect(screen.getByRole("link", { name: "Link 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Link 2" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Link 3" }).closest("[data-slide]")).toHaveAttribute("inert");
    expect(document.querySelectorAll("[inert]")).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /Go to slide/ })).toHaveLength(4);
  });

  it("takes translated wording", () => {
    render(
      <Carousel label="Historias" messages={{ next: "Siguiente", goTo: "Ir a la diapositiva {n}" }}>
        {slides(3)}
      </Carousel>,
    );
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir a la diapositiva 2" })).toBeInTheDocument();
  });

  describe("autoplay", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("is off by default and has no play button", () => {
      render(<Carousel label="Stories">{slides(3)}</Carousel>);
      expect(screen.queryByRole("button", { name: /autoplay/i })).toBeNull();
    });

    it("moves on its own, without announcing, and has a pause button", () => {
      vi.useFakeTimers();
      render(
        <Carousel label="Stories" autoplay autoplayInterval={2000}>
          {slides(3)}
        </Carousel>,
      );
      expect(screen.getByRole("button", { name: "Pause autoplay" })).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(2100);
      });
      expect(screen.getByRole("link", { name: "Link 2" })).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("stops when paused, on hover and on focus", () => {
      vi.useFakeTimers();
      render(
        <Carousel label="Stories" autoplay autoplayInterval={2000}>
          {slides(4)}
        </Carousel>,
      );
      const region = screen.getByRole("region");
      fireEvent.pointerEnter(region);
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByRole("link", { name: "Link 1" })).toBeInTheDocument();
      fireEvent.pointerLeave(region);
      act(() => {
        vi.advanceTimersByTime(2100);
      });
      expect(screen.getByRole("link", { name: "Link 2" })).toBeInTheDocument();
      fireEvent.focus(screen.getByRole("link", { name: "Link 2" }));
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByRole("link", { name: "Link 2" })).toBeInTheDocument();
      fireEvent.blur(screen.getByRole("link", { name: "Link 2" }));
      fireEvent.click(screen.getByRole("button", { name: "Pause autoplay" }));
      expect(screen.getByRole("button", { name: "Start autoplay" })).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByRole("link", { name: "Link 2" })).toBeInTheDocument();
    });

    it("never runs for people who prefer reduced motion", () => {
      vi.useFakeTimers();
      const original = window.matchMedia;
      window.matchMedia = ((q: string) => ({ ...original(q), matches: q.includes("prefers-reduced-motion") })) as typeof window.matchMedia;
      try {
        render(
          <Carousel label="Stories" autoplay autoplayInterval={2000}>
            {slides(3)}
          </Carousel>,
        );
        act(() => {
          vi.advanceTimersByTime(10000);
        });
        expect(screen.getByRole("link", { name: "Link 1" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /autoplay/i })).toBeNull();
      } finally {
        window.matchMedia = original;
      }
    });
  });

  it("renders on the server with every slide present", () => {
    const html = renderToString(<Carousel label="Stories">{slides(3)}</Carousel>);
    expect(html).toContain("#s2");
    expect(html).toContain('aria-roledescription="carousel"');
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Carousel label="Stories" autoplay slidesPerView={2}>
        {slides(5)}
      </Carousel>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

function Layout({ handle = "Resize panels", ...props }: { handle?: string } & Partial<React.ComponentProps<typeof ResizablePanelGroup>>) {
  return (
    <ResizablePanelGroup {...props}>
      <ResizablePanel id="left" defaultSize={30} minSize={10} maxSize={60}>
        left
      </ResizablePanel>
      <ResizableHandle label={handle} withHandle />
      <ResizablePanel id="right" minSize={10}>
        right
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

// jsdom has no PointerEvent: a mouse event with the pointer name carries the coordinates.
function pointer(el: Element, type: string, clientX: number) {
  fireEvent(el, new MouseEvent(type, { bubbles: true, clientX, button: 0 }));
}

describe("ResizablePanels", () => {
  afterEach(() => window.localStorage.clear());

  it("exposes a window splitter for the panel before it", () => {
    render(<Layout />);
    const handle = screen.getByRole("separator", { name: "Resize panels" });
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle).toHaveAttribute("aria-valuenow", "30");
    expect(handle).toHaveAttribute("aria-valuemin", "10");
    expect(handle).toHaveAttribute("aria-valuemax", "60");
    expect(handle).toHaveAttribute("aria-controls", "left");
    expect(handle).toHaveAttribute("tabindex", "0");
  });

  it("is a horizontal separator between stacked panels", () => {
    render(<Layout orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("gives panels sizes that add up to 100", () => {
    const { container } = render(<Layout />);
    const sizes = [...container.querySelectorAll<HTMLElement>("[data-panel]")].map((p) => Number(p.style.flexGrow));
    expect(sizes).toEqual([30, 70]);
  });

  it("resizes with arrow keys by 1 and with Shift by 10", async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(<Layout onLayoutChange={onLayoutChange} />);
    const handle = screen.getByRole("separator");
    handle.focus();
    await user.keyboard("{ArrowRight}");
    expect(handle).toHaveAttribute("aria-valuenow", "31");
    expect(onLayoutChange).toHaveBeenLastCalledWith([31, 69]);
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(handle).toHaveAttribute("aria-valuenow", "41");
    await user.keyboard("{ArrowLeft}");
    expect(handle).toHaveAttribute("aria-valuenow", "40");
  });

  it("goes to the limits with Home and End and never past them", async () => {
    const user = userEvent.setup();
    render(<Layout />);
    const handle = screen.getByRole("separator");
    handle.focus();
    await user.keyboard("{End}");
    expect(handle).toHaveAttribute("aria-valuenow", "60");
    await user.keyboard("{ArrowRight}");
    expect(handle).toHaveAttribute("aria-valuenow", "60");
    await user.keyboard("{Home}");
    expect(handle).toHaveAttribute("aria-valuenow", "10");
    await user.keyboard("{ArrowLeft}");
    expect(handle).toHaveAttribute("aria-valuenow", "10");
  });

  it("uses Up and Down when stacked", async () => {
    const user = userEvent.setup();
    render(<Layout orientation="vertical" />);
    const handle = screen.getByRole("separator");
    handle.focus();
    await user.keyboard("{ArrowDown}");
    expect(handle).toHaveAttribute("aria-valuenow", "31");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(handle).toHaveAttribute("aria-valuenow", "29");
  });

  it("resets on double click", async () => {
    const user = userEvent.setup();
    render(<Layout />);
    const handle = screen.getByRole("separator");
    handle.focus();
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(handle).toHaveAttribute("aria-valuenow", "40");
    await user.dblClick(handle);
    expect(handle).toHaveAttribute("aria-valuenow", "30");
  });

  it("drags with the pointer, captured, using the measured size", () => {
    const { container } = render(<Layout />);
    const root = container.querySelector<HTMLElement>("[data-panel-group]")!;
    root.getBoundingClientRect = () => ({ width: 1000, height: 400, top: 0, left: 0, right: 1000, bottom: 400, x: 0, y: 0, toJSON() {} }) as DOMRect;
    const handle = screen.getByRole("separator");
    handle.getBoundingClientRect = () => ({ width: 0, height: 400, top: 0, left: 300, right: 300, bottom: 400, x: 300, y: 0, toJSON() {} }) as DOMRect;
    const capture = vi.fn();
    handle.setPointerCapture = capture;
    handle.releasePointerCapture = vi.fn();
    pointer(handle, "pointerdown", 300);
    expect(capture).toHaveBeenCalled();
    pointer(handle, "pointermove", 400);
    expect(handle).toHaveAttribute("aria-valuenow", "40");
    pointer(handle, "pointermove", 900);
    expect(handle).toHaveAttribute("aria-valuenow", "60");
    pointer(handle, "pointerup", 0);
    pointer(handle, "pointermove", 100);
    expect(handle).toHaveAttribute("aria-valuenow", "60");
  });

  it("collapses a collapsible panel with Enter and restores its size", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ResizablePanelGroup>
        <ResizablePanel id="nav" defaultSize={30} minSize={20} collapsible>
          <a href="#x">Nav link</a>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>content</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = screen.getByRole("separator");
    expect(handle).toHaveAttribute("aria-valuemin", "0");
    handle.focus();
    await user.keyboard("{Enter}");
    expect(handle).toHaveAttribute("aria-valuenow", "0");
    expect(container.querySelector("#nav")).toHaveAttribute("data-collapsed");
    expect(container.querySelector("#nav")).toHaveAttribute("inert");
    await user.keyboard("{Enter}");
    expect(handle).toHaveAttribute("aria-valuenow", "30");
    expect(container.querySelector("#nav")).not.toHaveAttribute("inert");
  });

  it("collapses when stepped below the minimum and opens again at the minimum", async () => {
    const user = userEvent.setup();
    render(
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={21} minSize={20} collapsible>
          a
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>b</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = screen.getByRole("separator");
    handle.focus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(handle).toHaveAttribute("aria-valuenow", "0");
    await user.keyboard("{ArrowRight}");
    expect(handle).toHaveAttribute("aria-valuenow", "20");
  });

  it("remembers sizes under autoSaveId and ignores broken storage", async () => {
    const user = userEvent.setup();
    const first = render(<Layout autoSaveId="t1" />);
    screen.getByRole("separator").focus();
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(JSON.parse(window.localStorage.getItem("rdloom:resizable-panels:t1")!)).toEqual([40, 60]);
    first.unmount();
    render(<Layout autoSaveId="t1" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "40");
  });

  it("never throws when storage is unavailable or holds rubbish", async () => {
    window.localStorage.setItem("rdloom:resizable-panels:t2", "{nope");
    expect(() => render(<Layout autoSaveId="t2" />)).not.toThrow();
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    const user = userEvent.setup();
    screen.getByRole("separator").focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "31");
    spy.mockRestore();
  });

  it("renders on the server with the default sizes", () => {
    const html = renderToString(<Layout autoSaveId="ssr" />);
    expect(html).toContain('role="separator"');
    expect(html).toContain("flex-grow:30");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Layout />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
