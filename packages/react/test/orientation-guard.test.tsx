import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrientationGuard } from "../src";
import { axeViolations } from "./axe";

const original = { matchMedia: window.matchMedia, width: window.innerWidth, height: window.innerHeight };

interface Device {
  width: number;
  height: number;
  coarse: boolean;
}

/** Pretend to be a device. matchMedia answers the touch and orientation queries from it. */
function setDevice({ width, height, coarse }: Device) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true, writable: true });
  Object.defineProperty(window, "innerHeight", { value: height, configurable: true, writable: true });
  window.matchMedia = ((query: string) => ({
    matches: query.includes("pointer: coarse") ? coarse : query.includes("orientation: landscape") ? width > height : query.includes("orientation: portrait") ? height >= width : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

/** Turn the device and tell the page, the way a rotation does. */
function turnTo(device: Device) {
  act(() => {
    setDevice(device);
    window.dispatchEvent(new Event("resize"));
  });
}

const phoneUpright: Device = { width: 390, height: 844, coarse: true };
const phoneSideways: Device = { width: 844, height: 390, coarse: true };

beforeEach(() => setDevice(phoneUpright));
afterEach(() => {
  window.matchMedia = original.matchMedia;
  Object.defineProperty(window, "innerWidth", { value: original.width, configurable: true, writable: true });
  Object.defineProperty(window, "innerHeight", { value: original.height, configurable: true, writable: true });
  Object.defineProperty(window.screen, "orientation", { value: undefined, configurable: true });
  vi.restoreAllMocks();
});

const guard = (props: Partial<React.ComponentProps<typeof OrientationGuard>> = {}) =>
  render(
    <OrientationGuard {...props}>
      <label>
        Name <input />
      </label>
    </OrientationGuard>,
  );

describe("OrientationGuard", () => {
  describe("when it acts", () => {
    it("shows only the content when the phone is held the way the content needs", () => {
      guard();
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("covers the content with a message when a phone is held the other way", () => {
      setDevice(phoneSideways);
      guard();
      const dialog = screen.getByRole("dialog", { name: "Rotate your device" });
      expect(dialog).toHaveTextContent("This works best upright. Turn your phone so it is upright.");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("asks for sideways when landscape is required", () => {
      guard({ require: "landscape" });
      expect(screen.getByRole("dialog")).toHaveTextContent("This works best sideways. Turn your phone sideways.");
    });

    it("never acts on a tablet, whose shorter side is large", () => {
      setDevice({ width: 1024, height: 768, coarse: true });
      guard({ require: "portrait" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("never acts without a touch screen, however small the window", () => {
      setDevice({ width: 700, height: 400, coarse: false });
      guard({ require: "portrait" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("takes the size limit from appliesBelow", () => {
      setDevice({ width: 800, height: 700, coarse: true });
      const { unmount } = guard({ require: "portrait" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      unmount();
      guard({ require: "portrait", appliesBelow: 900 });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("believes current instead of the device, and skips the touch and size checks", () => {
      setDevice({ width: 1400, height: 900, coarse: false });
      guard({ require: "portrait", current: "landscape" });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("shows nothing when current matches", () => {
      guard({ require: "portrait", current: "portrait" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("is off with isDisabled", () => {
      setDevice(phoneSideways);
      guard({ isDisabled: true });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("trusts the screen's own orientation over the page's size, so a keyboard does not read as a turn", () => {
      // An upright phone whose on-screen keyboard shrinks the page until it is wider than it is tall.
      setDevice({ width: 390, height: 300, coarse: true });
      Object.defineProperty(window.screen, "orientation", { value: { type: "portrait-primary", addEventListener: () => {}, removeEventListener: () => {} }, configurable: true });
      guard({ require: "portrait" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("reads a landscape screen orientation", () => {
      Object.defineProperty(window.screen, "orientation", { value: { type: "landscape-secondary", addEventListener: () => {}, removeEventListener: () => {} }, configurable: true });
      guard({ require: "portrait" });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("turning the phone", () => {
    it("shows the message when the phone is turned the wrong way and removes it when it is turned back", () => {
      guard();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      turnTo(phoneSideways);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      turnTo(phoneUpright);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("keeps what was typed while the message is shown", async () => {
      const user = userEvent.setup();
      guard();
      await user.type(screen.getByLabelText("Name"), "Ana");
      turnTo(phoneSideways);
      turnTo(phoneUpright);
      expect(screen.getByLabelText("Name")).toHaveValue("Ana");
    });

    it("listens to the screen orientation's own change event", () => {
      const listeners: Array<() => void> = [];
      const orientation = { type: "portrait-primary", addEventListener: (_: string, fn: () => void) => listeners.push(fn), removeEventListener: () => {} };
      Object.defineProperty(window.screen, "orientation", { value: orientation, configurable: true });
      guard();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      act(() => {
        orientation.type = "landscape-primary";
        listeners.forEach((fn) => fn());
      });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("stops listening when removed", () => {
      const remove = vi.spyOn(window, "removeEventListener");
      const { unmount } = guard();
      unmount();
      expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
      expect(remove).toHaveBeenCalledWith("orientationchange", expect.any(Function));
    });
  });

  describe("the content behind", () => {
    it("is hidden from assistive technology and cannot be reached, but stays in the page", () => {
      setDevice(phoneSideways);
      guard();
      const content = screen.getByLabelText("Name", { selector: "input", exact: false }).closest("[aria-hidden]") as HTMLElement;
      expect(content).toHaveAttribute("aria-hidden", "true");
      expect(content).toHaveAttribute("inert");
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("is reachable again when the message goes away", () => {
      setDevice(phoneSideways);
      guard();
      turnTo(phoneUpright);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
  });

  describe("Continue anyway", () => {
    it("is offered by default and shows the content when chosen", async () => {
      const onDismiss = vi.fn();
      setDevice(phoneSideways);
      guard({ onDismiss });
      await userEvent.setup().click(screen.getByRole("button", { name: "Continue anyway" }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("also works from the keyboard and with Escape", async () => {
      const user = userEvent.setup();
      setDevice(phoneSideways);
      const { unmount } = guard();
      await user.tab();
      expect(screen.getByRole("button", { name: "Continue anyway" })).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      unmount();
      guard();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("is kept until the guard is removed, even when the phone is turned away and back", async () => {
      setDevice(phoneSideways);
      guard();
      await userEvent.setup().click(screen.getByRole("button", { name: "Continue anyway" }));
      turnTo(phoneUpright);
      turnTo(phoneSideways);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("is gone with dismissible=false, and Escape does nothing", async () => {
      setDevice(phoneSideways);
      guard({ dismissible: false });
      expect(screen.queryByRole("button", { name: "Continue anyway" })).not.toBeInTheDocument();
      await userEvent.setup().keyboard("{Escape}");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("focus", () => {
    it("moves into the message when it appears and back when it goes away", () => {
      guard();
      const input = screen.getByRole("textbox");
      input.focus();
      turnTo(phoneSideways);
      expect(screen.getByRole("dialog")).toHaveFocus();
      turnTo(phoneUpright);
      expect(screen.getByRole("textbox")).toHaveFocus();
    });
  });

  it("takes focus for a box inside a page only when focus was inside the content that became unreachable", () => {
    guard({ scope: "container" });
    // Focus elsewhere on the page: the box leaves it alone when it appears.
    turnTo(phoneSideways);
    expect(screen.getByRole("dialog")).not.toHaveFocus();
    turnTo(phoneUpright);
    // Focus inside the content: it would be lost, so the message takes it and gives it back.
    screen.getByRole("textbox").focus();
    turnTo(phoneSideways);
    expect(screen.getByRole("dialog")).toHaveFocus();
    turnTo(phoneUpright);
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("does not take focus when the page opens already blocked and the focus is elsewhere, even after the first render", () => {
    // The first render is the server's (not blocked); the message appears on the next one.
    setDevice(phoneSideways);
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    guard({ scope: "container" });
    expect(screen.getByRole("dialog")).not.toHaveFocus();
    expect(outside).toHaveFocus();
    outside.remove();
  });

  it("takes focus at load only for the whole screen, not for a box inside a page", () => {
    setDevice(phoneSideways);
    const { unmount } = guard({ scope: "container" });
    expect(screen.getByRole("dialog")).not.toHaveFocus();
    unmount();
    guard({ scope: "screen" });
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  describe("onBlockedChange", () => {
    it("reports true when the message appears and false when it goes away, and nothing at rest", () => {
      const onBlockedChange = vi.fn();
      guard({ onBlockedChange });
      expect(onBlockedChange).not.toHaveBeenCalled();
      turnTo(phoneSideways);
      expect(onBlockedChange).toHaveBeenLastCalledWith(true);
      turnTo(phoneUpright);
      expect(onBlockedChange).toHaveBeenLastCalledWith(false);
      expect(onBlockedChange).toHaveBeenCalledTimes(2);
    });

    it("reports true at once when the guard starts out blocked, and false after Continue anyway", async () => {
      const onBlockedChange = vi.fn();
      setDevice(phoneSideways);
      guard({ onBlockedChange });
      expect(onBlockedChange).toHaveBeenCalledWith(true);
      await userEvent.setup().click(screen.getByRole("button", { name: "Continue anyway" }));
      expect(onBlockedChange).toHaveBeenLastCalledWith(false);
    });
  });

  describe("labels", () => {
    it("takes the words from labels", () => {
      setDevice(phoneSideways);
      guard({ labels: { title: "Gira", message: "De lado.", dismiss: "Seguir" } });
      expect(screen.getByRole("dialog", { name: "Gira" })).toHaveTextContent("De lado.");
      expect(screen.getByRole("button", { name: "Seguir" })).toBeInTheDocument();
    });

    it("keeps the other words when only one is given", () => {
      setDevice(phoneSideways);
      guard({ labels: { title: "Gira" } });
      expect(screen.getByRole("dialog")).toHaveTextContent("This works best upright");
      expect(screen.getByRole("button", { name: "Continue anyway" })).toBeInTheDocument();
    });
  });

  describe("tryLock", () => {
    const withLock = () => {
      const lock = vi.fn().mockResolvedValue(undefined);
      const unlock = vi.fn();
      Object.defineProperty(window.screen, "orientation", { value: { type: "portrait-primary", lock, unlock, addEventListener: () => {}, removeEventListener: () => {} }, configurable: true });
      return { lock, unlock };
    };

    it("asks the browser to lock the required orientation and unlocks when removed", () => {
      const { lock, unlock } = withLock();
      const { unmount } = guard({ tryLock: true, require: "landscape" });
      expect(lock).toHaveBeenCalledWith("landscape");
      unmount();
      expect(unlock).toHaveBeenCalled();
    });

    it("does not lock by default", () => {
      const { lock } = withLock();
      guard();
      expect(lock).not.toHaveBeenCalled();
    });

    it("carries on when the browser refuses", async () => {
      const lock = vi.fn().mockRejectedValue(new Error("NotSupportedError"));
      Object.defineProperty(window.screen, "orientation", { value: { type: "portrait-primary", lock, addEventListener: () => {}, removeEventListener: () => {} }, configurable: true });
      guard({ tryLock: true });
      await act(async () => {});
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("does nothing where the browser cannot lock at all", () => {
      expect(() => guard({ tryLock: true })).not.toThrow();
    });
  });

  it("covers the whole screen by default and only its own box with scope=container", () => {
    setDevice(phoneSideways);
    const { unmount } = guard();
    expect(screen.getByRole("dialog")).toHaveClass("fixed");
    unmount();
    guard({ scope: "container" });
    expect(screen.getByRole("dialog")).toHaveClass("absolute");
  });

  it("shows the content and no message when rendered on the server", () => {
    setDevice(phoneSideways);
    const html = renderToString(
      <OrientationGuard>
        <p>Server content</p>
      </OrientationGuard>,
    );
    expect(html).toContain("Server content");
    expect(html).not.toContain("Rotate your device");
  });

  it("turns the picture only for people who accept motion", () => {
    setDevice(phoneSideways);
    guard();
    const icon = screen.getByRole("dialog").querySelector("[aria-hidden=true]") as HTMLElement;
    expect(icon.className).toContain("motion-safe:animate-");
    expect(icon.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("adds className and slot classNames after the built-in ones, and forwards the ref", () => {
    const ref = { current: null as HTMLDivElement | null };
    setDevice(phoneSideways);
    render(
      <OrientationGuard ref={ref} className="own" classNames={{ root: "r", content: "c", overlay: "o", icon: "i", title: "t", message: "m", button: "b" }}>
        <p>Body</p>
      </OrientationGuard>,
    );
    expect(ref.current).toHaveClass("own", "r");
    for (const slot of ["c", "o", "i", "t", "m", "b"]) expect(ref.current?.querySelector(`.${slot}`)).not.toBeNull();
  });

  it("has no accessibility violations at rest, with the message, and without Continue anyway", async () => {
    const { container, unmount } = guard();
    expect(await axeViolations(container)).toEqual([]);
    unmount();
    setDevice(phoneSideways);
    const blocked = guard();
    expect(await axeViolations(blocked.container)).toEqual([]);
    blocked.unmount();
    const required = guard({ dismissible: false, require: "landscape", current: "portrait" });
    expect(await axeViolations(required.container)).toEqual([]);
  });
});
