import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chat, GlobeIcon, Message, PromptInput, ToastRegion, fileToAttachment, isLocalImage, releaseAttachment, toast, toastQueue, type PromptAttachment } from "../src";
import { axeViolations } from "./axe";

const att = (over: Partial<PromptAttachment> = {}): PromptAttachment => ({ id: "a1", name: "photo.png", mediaType: "image/png", url: "blob:http://x/1", size: 2048, ...over });

describe("PromptInput: the bar and its buttons", () => {
  it("is a plain box when you ask for nothing: a text box and Send", () => {
    render(<PromptInput onSubmit={() => {}} />);
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Send message"]);
  });

  it("adds the + menu only when there is something to put in it", async () => {
    const { rerender } = render(<PromptInput onSubmit={() => {}} onAttach={() => {}} />);
    expect(screen.getByRole("button", { name: "Add attachments or tools" })).toBeInTheDocument();
    rerender(<PromptInput onSubmit={() => {}} actions={[{ id: "x", label: "Web search", onSelect: () => {} }]} />);
    expect(screen.getByRole("button", { name: "Add attachments or tools" })).toBeInTheDocument();
    rerender(<PromptInput onSubmit={() => {}} />);
    expect(screen.queryByRole("button", { name: "Add attachments or tools" })).toBeNull();
  });

  it("lists the built-in file entry first, then your own, each with a name and a description", async () => {
    render(
      <PromptInput
        onSubmit={() => {}}
        onAttach={() => {}}
        actions={[{ id: "search", label: "Web search", description: "Find real-time news", icon: <GlobeIcon />, onSelect: () => {} }]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Add attachments or tools" }));
    const menu = await screen.findByRole("menu", { name: "Add attachments or tools" });
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Add photos & filesUpload from computer", "Web searchFind real-time news"]);
  });

  it("runs the entry you choose and closes the menu", async () => {
    const onSelect = vi.fn();
    render(<PromptInput onSubmit={() => {}} actions={[{ id: "search", label: "Web search", onSelect }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Add attachments or tools" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /Web search/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("opens the file picker from the menu and hands the chosen files over, then puts focus back in the text", async () => {
    const onAttach = vi.fn();
    const { container } = render(<PromptInput onSubmit={() => {}} onAttach={onAttach} accept="image/*" />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input).toHaveAttribute("accept", "image/*");
    expect(input).toHaveAttribute("multiple");
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    await userEvent.click(screen.getByRole("button", { name: "Add attachments or tools" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /Add photos & files/ }));
    expect(click).toHaveBeenCalled();

    const file = new File(["x"], "notes.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onAttach).toHaveBeenCalledWith([file]);
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("shows added files as a labelled list, says so politely, and can remove them", async () => {
    const onRemove = vi.fn();
    const { rerender } = render(<PromptInput onSubmit={() => {}} attachments={[]} onRemoveAttachment={onRemove} />);
    rerender(<PromptInput onSubmit={() => {}} attachments={[att(), att({ id: "a2", name: "report.pdf", mediaType: "application/pdf", url: undefined, size: 3 * 1024 * 1024 })]} onRemoveAttachment={onRemove} />);
    const list = screen.getByRole("list", { name: "Attachments" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    // a picture from this device is drawn small with its file name as alt text; a document is a chip with its size
    expect(within(list).getByRole("img", { name: "photo.png" })).toBeInTheDocument();
    expect(within(list).getByText("report.pdf")).toBeInTheDocument();
    expect(within(list).getByText("3.0 MB")).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((s) => s.textContent === "Added photo.png, report.pdf")).toBe(true);

    await userEvent.click(screen.getByRole("button", { name: "Remove report.pdf" }));
    expect(onRemove).toHaveBeenCalledWith("a2");
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("announces a removal", () => {
    const { rerender } = render(<PromptInput onSubmit={() => {}} attachments={[att()]} />);
    rerender(<PromptInput onSubmit={() => {}} attachments={[]} />);
    expect(screen.getAllByRole("status").some((s) => s.textContent === "Removed photo.png")).toBe(true);
  });

  it("never draws a picture from a remote address", () => {
    expect(isLocalImage({ mediaType: "image/png", url: "https://tracker.example/p.png" })).toBe(false);
    expect(isLocalImage({ mediaType: "image/png", url: "blob:http://x/1" })).toBe(true);
    expect(isLocalImage({ url: "data:image/png;base64,AAAA" })).toBe(true);
    expect(isLocalImage({ mediaType: "application/pdf", url: "blob:http://x/2" })).toBe(false);
    const { container } = render(<PromptInput onSubmit={() => {}} attachments={[att({ url: "https://tracker.example/p.png" })]} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("photo.png")).toBeInTheDocument();
  });

  it("can send files with no text, and hands the files over", async () => {
    const onSubmit = vi.fn();
    const files = [att()];
    render(<PromptInput onSubmit={onSubmit} attachments={files} />);
    const send = screen.getByRole("button", { name: "Send message" });
    expect(send).toBeEnabled();
    await userEvent.click(send);
    expect(onSubmit).toHaveBeenCalledWith("", files);
  });

  it("has a microphone toggle whose name follows its state", async () => {
    const onVoice = vi.fn();
    const { rerender } = render(<PromptInput onSubmit={() => {}} onVoice={onVoice} />);
    const mic = screen.getByRole("button", { name: "Dictate" });
    expect(mic).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(mic);
    expect(onVoice).toHaveBeenCalled();
    rerender(<PromptInput onSubmit={() => {}} onVoice={onVoice} isListening />);
    expect(screen.getByRole("button", { name: "Stop dictation" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows your own controls on the right", () => {
    render(<PromptInput onSubmit={() => {}} endContent={<button>Think</button>} />);
    expect(screen.getByRole("button", { name: "Think" })).toBeInTheDocument();
  });

  it("becomes two rows when the text has several lines without moving or replacing the text box, and stays so until it is empty", async () => {
    function Harness() {
      const [v, setV] = useState("");
      return <PromptInput onSubmit={() => {}} value={v} onValueChange={setV} onAttach={() => {}} />;
    }
    const { container } = render(<Harness />);
    const box = screen.getByRole("textbox");
    const bar = () => container.querySelector("textarea")!.parentElement!;
    expect(bar().className).toContain("lead_field_trail");
    await userEvent.type(box, "one{Shift>}{Enter}{/Shift}two");
    expect(bar().className).toContain("field_field");
    expect(screen.getByRole("textbox")).toBe(box); // the same element: focus and the caret were never disturbed
    expect(box).toHaveFocus();
    await userEvent.clear(box);
    expect(bar().className).toContain("lead_field_trail");
  });

  it("creates previews for pictures only and frees them", () => {
    const create = vi.fn(() => "blob:http://x/9");
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const image = fileToAttachment(new File(["x"], "a.png", { type: "image/png" }));
    const doc = fileToAttachment(new File(["x"], "a.pdf", { type: "application/pdf" }));
    expect(image.url).toBe("blob:http://x/9");
    expect(doc.url).toBeUndefined();
    expect(new Set([image.id, doc.id]).size).toBe(2);
    releaseAttachment(image);
    releaseAttachment(doc);
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations with everything on, and with the menu open", async () => {
    const { container } = render(
      <PromptInput
        onSubmit={() => {}}
        attachments={[att(), att({ id: "a2", name: "report.pdf", url: undefined, mediaType: "application/pdf" })]}
        onAttach={() => {}}
        onRemoveAttachment={() => {}}
        onVoice={() => {}}
        actions={[{ id: "s", label: "Web search", description: "Find news", icon: <GlobeIcon />, onSelect: () => {} }]}
      />,
    );
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Add attachments or tools" }));
    await screen.findByRole("menu");
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe("Chat and Message with files", () => {
  it("passes the composer's files to onSend", async () => {
    const onSend = vi.fn();
    const files = [att()];
    render(<Chat messages={[]} onSend={onSend} attachments={files} onAttach={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSend).toHaveBeenCalledWith("", files);
  });

  it("shows a sent picture small, with its name as alt text, and a document as a chip; a remote picture is never loaded", () => {
    const { container } = render(
      <Message
        message={{
          id: "u",
          role: "user",
          parts: [
            { type: "file", name: "photo.png", mediaType: "image/png", url: "blob:http://x/1" },
            { type: "file", name: "remote.png", mediaType: "image/png", url: "https://tracker.example/p.png" },
            { type: "file", name: "report.pdf", mediaType: "application/pdf" },
          ],
        }}
      />,
    );
    expect(screen.getByRole("img", { name: "photo.png" })).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(screen.getByText("remote.png")).toBeInTheDocument();
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });
});

describe("Toast", () => {
  afterEach(() => {
    vi.useRealTimers();
    act(() => toastQueue.clear()); // the queue is shared by the whole app
  });

  it("closes itself after ten seconds by default, and stays when you ask it to", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<ToastRegion />);
    act(() => {
      toast({ title: "Saved" });
      toast({ title: "Update ready", timeout: 0 });
    });
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(9_000));
    expect(screen.getByText("Saved")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1_500));
    await waitFor(() => expect(screen.queryByText("Saved")).toBeNull());
    expect(screen.getByText("Update ready")).toBeInTheDocument();
  });

  it("shows each tone with its own icon shape and a name for the close button", async () => {
    render(<ToastRegion />);
    act(() => {
      toast({ title: "Neutral one", timeout: 0 });
      toast({ title: "Success one", variant: "success", timeout: 0 });
      toast({ title: "Danger one", variant: "danger", timeout: 0 });
    });
    const shapes = await Promise.all(["Neutral one", "Success one", "Danger one"].map(async (t) => (await screen.findByText(t)).closest("[role=alertdialog]")!.querySelector("svg")!.innerHTML));
    expect(new Set(shapes).size).toBe(3);
    expect(screen.getAllByRole("button", { name: "Dismiss" })).toHaveLength(3);
  });
});
