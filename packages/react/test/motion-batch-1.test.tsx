import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedCircularProgress, Marquee, NumberTicker } from "../src";
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
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("AnimatedCircularProgress", () => {
  it("is a named progressbar with its value", () => {
    render(<AnimatedCircularProgress value={40} label="Upload" />);
    const bar = screen.getByRole("progressbar", { name: "Upload" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveTextContent("40%");
  });

  it("uses a custom range and clamps", () => {
    render(<AnimatedCircularProgress value={30} maxValue={20} label="Tasks" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20");
  });

  it("omits aria-valuenow and the value text while indeterminate", () => {
    render(<AnimatedCircularProgress isIndeterminate label="Loading" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(bar.querySelector(".rdm-cprogress-spin")).not.toBeNull();
  });

  it("fills from empty after mount, and stays at the final value for reduced motion", async () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<AnimatedCircularProgress value={60} label="A" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--rdm-pct")).toBe("0");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(root.style.getPropertyValue("--rdm-pct")).toBe("60");
    unmount();

    mockMotionPreference(true);
    const still = render(<AnimatedCircularProgress value={60} label="A" />);
    expect((still.container.firstElementChild as HTMLElement).style.getPropertyValue("--rdm-pct")).toBe("60");
  });

  it("marks the spin as paused", () => {
    const { container } = render(<AnimatedCircularProgress isIndeterminate isPaused label="L" />);
    expect(container.firstElementChild).toHaveAttribute("data-rdm-paused");
  });

  it("renders the final value in server HTML", () => {
    const html = renderToString(<AnimatedCircularProgress value={55} label="S" />);
    expect(html).toContain("55%");
    expect(html).toContain('aria-valuenow="55"');
  });

  it("has no axe violations", async () => {
    const { container } = render(<AnimatedCircularProgress value={30} label="Quota" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("NumberTicker", () => {
  it("always has the final formatted value as accessible text", () => {
    const { container } = render(<NumberTicker value={12840} locale="en-US" />);
    expect(container).toHaveTextContent("12,840");
    expect(screen.getAllByText("12,840").length).toBeGreaterThan(0);
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });

  it("formats decimals with the given locale", () => {
    render(<NumberTicker value={1234.5} decimals={2} locale="de-DE" />);
    expect(screen.getAllByText("1.234,50").length).toBeGreaterThan(0);
  });

  it("counts from `from` to the value after mount", async () => {
    vi.useFakeTimers();
    const { container } = render(<NumberTicker value={100} from={20} duration={1} locale="en-US" />);
    const visible = () => container.querySelector("[aria-hidden='true']")!.textContent;
    expect(visible()).toBe("20");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(visible()).toBe("100");
  });

  it("shows the final value at once for reduced motion and when paused", () => {
    mockMotionPreference(true);
    const a = render(<NumberTicker value={500} from={0} locale="en-US" />);
    expect(a.container.querySelector("[aria-hidden='true']")!.textContent).toBe("500");
    mockMotionPreference(false);
    const b = render(<NumberTicker value={700} from={0} isPaused locale="en-US" />);
    expect(b.container.querySelector("[aria-hidden='true']")!.textContent).toBe("700");
  });

  it("waits for the number to scroll into view", async () => {
    vi.useFakeTimers();
    let notify: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: typeof notify) {
          notify = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container } = render(<NumberTicker value={90} from={10} duration={1} startWhenInView locale="en-US" />);
    const visible = () => container.querySelector("[aria-hidden='true']")!.textContent;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(visible()).toBe("10");
    await act(async () => {
      notify([{ isIntersecting: true }]);
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(visible()).toBe("90");
  });

  it("renders the final value in server HTML", () => {
    expect(renderToString(<NumberTicker value={2500} from={0} />)).toContain("2,500");
  });

  it("has no axe violations", async () => {
    const { container } = render(<NumberTicker value={42} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Marquee", () => {
  const items = ["One", "Two", "Three"].map((t) => <span key={t}>{t}</span>);

  it("keeps the items readable once and hides the repeats", () => {
    const { container } = render(<Marquee>{items}</Marquee>);
    expect(screen.getAllByText("One")).toHaveLength(2);
    expect(screen.getAllByText("One", { ignore: "[aria-hidden='true'] *" })).toHaveLength(1);
    const dup = container.querySelector(".rdm-marquee-dup")!;
    expect(dup).toHaveAttribute("aria-hidden", "true");
    expect(dup.hasAttribute("inert")).toBe(true);
  });

  it("reflects direction, reverse, fade and paused", () => {
    const { container } = render(
      <Marquee direction="vertical" reverse isPaused fade>
        {items}
      </Marquee>,
    );
    expect(container.querySelector(".rdm-marquee-track")).toHaveAttribute("data-vertical");
    expect(container.querySelector(".rdm-marquee-track")).toHaveAttribute("data-reverse");
    expect(container.querySelector(".rdm-marquee-view")).toHaveAttribute("data-fade", "vertical");
    expect(container.firstElementChild).toHaveAttribute("data-rdm-paused");
  });

  it("pauses on hover by default and can opt out", () => {
    const a = render(<Marquee>{items}</Marquee>);
    expect(a.container.firstElementChild).toHaveAttribute("data-pause-hover");
    const b = render(<Marquee pauseOnHover={false}>{items}</Marquee>);
    expect(b.container.firstElementChild).not.toHaveAttribute("data-pause-hover");
  });

  it("toggles with the Pause button", async () => {
    const user = userEvent.setup();
    const { container } = render(<Marquee showPauseButton>{items}</Marquee>);
    const button = screen.getByRole("button", { name: "Pause" });
    expect(container.firstElementChild).not.toHaveAttribute("data-rdm-paused");
    await user.click(button);
    expect(container.firstElementChild).toHaveAttribute("data-rdm-paused");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(container.firstElementChild).not.toHaveAttribute("data-rdm-paused");
  });

  it("has no button unless asked", () => {
    render(<Marquee>{items}</Marquee>);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("still renders real content with reduced motion", () => {
    mockMotionPreference(true);
    render(<Marquee>{items}</Marquee>);
    expect(screen.getAllByText("Two").length).toBeGreaterThan(0);
  });

  it("renders the items in server HTML", () => {
    const html = renderToString(<Marquee>{items}</Marquee>);
    expect(html).toContain("Three");
    expect(html).toContain('aria-hidden="true"');
  });

  it("has no axe violations", async () => {
    const { container } = render(<Marquee showPauseButton>{items}</Marquee>);
    expect(await axeViolations(container)).toEqual([]);
  });
});
