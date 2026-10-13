import { act, createEvent, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroVideoDialog, Lens, PixelImage, SelvedgeBlur, ThemeToggler } from "../src";
import { axeViolations } from "./axe";

function mockMotionPreference(reduce: boolean) {
  const query = { matches: reduce, media: "(prefers-reduced-motion: reduce)", addEventListener: () => {}, removeEventListener: () => {} };
  vi.stubGlobal("matchMedia", () => query);
}

beforeEach(() => mockMotionPreference(false));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.documentElement.removeAttribute("data-theme");
});

describe("SelvedgeBlur", () => {
  it("is a hidden, pointer-transparent stack of blur layers on the chosen edge", () => {
    const { container } = render(<SelvedgeBlur position="top" strength={10} layers={4} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("data-position", "top");
    expect(root.className).toContain("pointer-events-none");
    expect(root.querySelectorAll(".rdm-selvedge-layer")).toHaveLength(4);
  });

  it("grows the blur toward the edge and has no axe violations", async () => {
    const { container } = render(<div><SelvedgeBlur layers={3} strength={8} /></div>);
    const blurs = [...container.querySelectorAll<HTMLElement>(".rdm-selvedge-layer")].map((l) => parseFloat(l.style.backdropFilter.replace(/[^\d.]/g, "")));
    expect(blurs[0]).toBeLessThan(blurs[2]);
    expect(blurs[2]).toBe(8);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("renders on the server", () => {
    expect(renderToString(<SelvedgeBlur position="end" />)).toContain("rdm-selvedge");
  });
});

describe("Lens", () => {
  const lens = (props: Record<string, unknown> = {}) => (
    <Lens {...props}>
      <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="A chart of sales" />
    </Lens>
  );

  it("keeps the child accessible and adds the lens only under a mouse", () => {
    const { container } = render(lens());
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(container.querySelector(".rdm-lens-layer")).toBeNull();
    const root = container.firstElementChild as HTMLElement;
    fireEvent.pointerMove(root, { pointerType: "mouse", clientX: 20, clientY: 10 });
    const layer = container.querySelector(".rdm-lens-layer") as HTMLElement;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer).toHaveAttribute("inert");
    expect(screen.getAllByRole("img")).toHaveLength(1);
    fireEvent.pointerLeave(root);
    expect(container.querySelector(".rdm-lens-layer")).toBeNull();
  });

  it("does nothing for touch, reduced motion, isStill or an enclosing rdm-still", () => {
    const touch = render(lens());
    // jsdom has no PointerEvent, so the pointer type is set on the event by hand.
    const touchMove = createEvent.pointerMove(touch.container.firstElementChild as HTMLElement);
    Object.defineProperty(touchMove, "pointerType", { value: "touch" });
    fireEvent(touch.container.firstElementChild as HTMLElement, touchMove);
    expect(touch.container.querySelector(".rdm-lens-layer")).toBeNull();

    const still = render(lens({ isStill: true }));
    fireEvent.pointerMove(still.container.firstElementChild as HTMLElement, { pointerType: "mouse" });
    expect(still.container.querySelector(".rdm-lens-layer")).toBeNull();

    const wrapped = render(<div className="rdm-still">{lens()}</div>);
    fireEvent.pointerMove(wrapped.container.querySelector(".rdm-lens") as HTMLElement, { pointerType: "mouse" });
    expect(wrapped.container.querySelector(".rdm-lens-layer")).toBeNull();

    mockMotionPreference(true);
    const reduced = render(lens());
    fireEvent.pointerMove(reduced.container.firstElementChild as HTMLElement, { pointerType: "mouse" });
    expect(reduced.container.querySelector(".rdm-lens-layer")).toBeNull();
  });

  it("has no axe violations while the lens is showing, and renders on the server", async () => {
    const { container } = render(lens());
    fireEvent.pointerMove(container.firstElementChild as HTMLElement, { pointerType: "mouse", clientX: 5, clientY: 5 });
    expect(await axeViolations(container)).toEqual([]);
    expect(renderToString(lens())).toContain("A chart of sales");
  });
});

describe("PixelImage", () => {
  const src = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

  it("always renders the real image, from src or from children", () => {
    const a = render(<PixelImage src={src} alt="Team photo" />);
    expect(screen.getByRole("img", { name: "Team photo" })).toBeInTheDocument();
    a.unmount();
    render(
      <PixelImage>
        <img src={src} alt="Own image" />
      </PixelImage>,
    );
    expect(screen.getByRole("img", { name: "Own image" })).toBeInTheDocument();
  });

  it("server HTML contains only the image, with no canvas", () => {
    const html = renderToString(<PixelImage src={src} alt="Team photo" />);
    expect(html).toContain("Team photo");
    expect(html).not.toContain("<canvas");
  });

  it("shows no blocks for reduced motion, isStill or an enclosing rdm-still", () => {
    mockMotionPreference(true);
    const reduced = render(<PixelImage src={src} alt="a" />);
    expect(reduced.container.querySelector("canvas")).toBeNull();
    reduced.unmount();
    mockMotionPreference(false);
    const still = render(<PixelImage src={src} alt="a" isStill />);
    expect(still.container.querySelector("canvas")).toBeNull();
    still.unmount();
    const wrapped = render(<div className="rdm-still"><PixelImage src={src} alt="a" /></div>);
    expect(wrapped.container.querySelector("canvas")).toBeNull();
  });

  it("falls back to the plain image when the canvas cannot draw, and the canvas is decoration", async () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    Object.defineProperty(HTMLImageElement.prototype, "complete", { configurable: true, get: () => true });
    const { container } = render(<PixelImage src={src} alt="Team photo" />);
    await act(async () => {});
    expect(container.querySelector("canvas")).toBeNull();
    expect(screen.getByRole("img", { name: "Team photo" })).toBeInTheDocument();
    getContext.mockRestore();
    delete (HTMLImageElement.prototype as unknown as Record<string, unknown>).complete;
    expect(await axeViolations(container)).toEqual([]);
  });

  it("steps from coarse blocks to the sharp image and then removes the canvas", async () => {
    vi.useFakeTimers();
    const draws: number[] = [];
    const ctx = { drawImage: (_i: unknown, ...a: number[]) => draws.push(a.length), imageSmoothingEnabled: true };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    Object.defineProperty(HTMLImageElement.prototype, "clientWidth", { configurable: true, get: () => 100 });
    Object.defineProperty(HTMLImageElement.prototype, "clientHeight", { configurable: true, get: () => 60 });
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", { configurable: true, get: () => 200 });
    Object.defineProperty(HTMLImageElement.prototype, "complete", { configurable: true, get: () => true });
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<PixelImage src={src} alt="Team photo" blockSize={16} duration={1} whenInView={false} />);
    await act(async () => {});
    expect(container.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
    expect(draws.length).toBeGreaterThan(0);
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(container.querySelector("canvas")).toBeNull();
    vi.restoreAllMocks();
    for (const key of ["clientWidth", "clientHeight", "naturalWidth", "complete"]) delete (HTMLImageElement.prototype as unknown as Record<string, unknown>)[key];
  });
});

describe("ThemeToggler", () => {
  it("is a named group of three options with one chosen", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThemeToggler defaultValue="light" onValueChange={onValueChange} />);
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(onValueChange).toHaveBeenCalledWith("dark");
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
  });

  it("moves with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<ThemeToggler defaultValue="light" />);
    await user.tab();
    expect(screen.getByRole("radio", { name: "Light" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveFocus();
  });

  it("is controlled by value and keeps one chosen when the chosen one is pressed again", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThemeToggler value="dark" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "System" }));
    expect(onValueChange).toHaveBeenCalledWith("system");
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
  });

  it("button mode names the choice and the next one, and cycles", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThemeToggler mode="button" defaultValue="light" onValueChange={onValueChange} />);
    const button = screen.getByRole("button", { name: "Theme: light. Switch to dark" });
    await user.click(button);
    expect(onValueChange).toHaveBeenLastCalledWith("dark");
    await user.click(screen.getByRole("button", { name: "Theme: dark. Switch to system" }));
    expect(onValueChange).toHaveBeenLastCalledWith("system");
    await user.click(screen.getByRole("button", { name: "Theme: system. Switch to light" }));
    expect(onValueChange).toHaveBeenLastCalledWith("light");
  });

  it("touches the document and storage only when asked, and never storage", async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { unmount } = render(<ThemeToggler defaultValue="light" />);
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    unmount();
    render(<ThemeToggler applyToDocument defaultValue="light" />);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("animates the icon only after a change, and not with isStill or reduced motion class rules", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<ThemeToggler defaultValue="light" />);
    expect(container.querySelector(".rdm-theme-icon")).toBeNull();
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(container.querySelector(".rdm-theme-icon")).not.toBeNull();
    rerender(<ThemeToggler defaultValue="light" isStill />);
    expect(container.querySelector(".rdm-theme-icon")).toBeNull();
  });

  it("has no axe violations in either mode, and renders on the server", async () => {
    const a = render(<ThemeToggler />);
    expect(await axeViolations(a.container)).toEqual([]);
    a.unmount();
    const b = render(<ThemeToggler mode="button" />);
    expect(await axeViolations(b.container)).toEqual([]);
    expect(renderToString(<ThemeToggler />)).toContain("Light");
  });
});

describe("HeroVideoDialog", () => {
  const props = { title: "Product tour", videoSrc: "/media/tour.mp4", poster: <div data-testid="poster" /> };

  it("is a named button and does not render the video until opened", () => {
    const { container } = render(<HeroVideoDialog {...props} />);
    expect(screen.getByRole("button", { name: "Play video: Product tour" })).toBeInTheDocument();
    expect(container.querySelector("video")).toBeNull();
    expect(document.querySelector("video")).toBeNull();
  });

  it("opens a dialog with the video, closes with Escape and returns focus", async () => {
    const user = userEvent.setup();
    render(<HeroVideoDialog {...props} tracks={<track kind="captions" src="/c.vtt" srcLang="en" label="English" />} />);
    const trigger = screen.getByRole("button", { name: "Play video: Product tour" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Product tour" });
    const video = dialog.querySelector("video") as HTMLVideoElement;
    expect(video).toHaveAttribute("src", "/media/tour.mp4");
    expect(video).toHaveAttribute("controls");
    expect(video.querySelector("track")).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector("video")).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes from the Close button", async () => {
    const user = userEvent.setup();
    render(<HeroVideoDialog {...props} />);
    await user.click(screen.getByRole("button", { name: "Play video: Product tour" }));
    await user.click(await screen.findByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("turns a string poster into a decorative image, and isStill marks the button", () => {
    const { container } = render(<HeroVideoDialog title="T" videoSrc="/v.mp4" poster="data:image/gif;base64,R0lGODlhAQABAAAAACw=" isStill />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.getByRole("button")).toHaveAttribute("data-rdm-still", "true");
  });

  it("has no axe violations closed or open, and renders on the server", async () => {
    const user = userEvent.setup();
    const { container } = render(<HeroVideoDialog {...props} />);
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Play video: Product tour" }));
    const dialog = await screen.findByRole("dialog");
    expect(await axeViolations(dialog)).toEqual([]);
    expect(renderToString(<HeroVideoDialog {...props} />)).not.toContain("<video");
  });
});
