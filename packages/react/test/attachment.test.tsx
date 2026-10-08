import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Attachment, AttachmentList } from "../src";
import { axeViolations } from "./axe";

describe("Attachment", () => {
  it("shows the name and size", () => {
    render(<Attachment name="report.pdf" sizeText="2.4 MB" mediaType="application/pdf" />);
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("2.4 MB")).toBeInTheDocument();
  });

  it("removes with a button named after the file, by mouse and keyboard", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<Attachment name="report.pdf" onRemove={onRemove} />);
    const button = screen.getByRole("button", { name: "Remove report.pdf" });
    await user.click(button);
    expect(onRemove).toHaveBeenCalledTimes(1);
    button.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onRemove).toHaveBeenCalledTimes(3);
  });

  it("has no remove button without onRemove", () => {
    render(<Attachment name="report.pdf" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("makes the name a link with href and a button with onPress", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(<Attachment name="a.pdf" href="/files/a.pdf" />);
    expect(screen.getByRole("link", { name: "a.pdf" })).toHaveAttribute("href", "/files/a.pdf");
    rerender(<Attachment name="a.pdf" onPress={onPress} />);
    await user.click(screen.getByRole("button", { name: "a.pdf" }));
    expect(onPress).toHaveBeenCalled();
  });

  it("shows determinate and indeterminate upload progress", () => {
    const { rerender } = render(<Attachment name="a.pdf" status="uploading" progress={40} />);
    const bar = screen.getByRole("progressbar", { name: "Uploading a.pdf" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    rerender(<Attachment name="a.pdf" status="uploading" />);
    expect(screen.getByRole("progressbar", { name: "Uploading a.pdf" })).not.toHaveAttribute("aria-valuenow");
  });

  it("announces an error and hides the progress bar", () => {
    render(<Attachment name="a.zip" status="error" errorMessage="Too large" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Too large");
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("renders a thumbnail in the preview variant", () => {
    render(<Attachment variant="preview" name="a.png" thumbnail={<img src="x.png" alt="A sunrise" />} />);
    expect(screen.getByAltText("A sunrise")).toBeInTheDocument();
  });

  it("lists attachments as list items", () => {
    render(
      <AttachmentList aria-label="Files">
        <Attachment name="a.pdf" />
        <Attachment name="b.pdf" />
      </AttachmentList>,
    );
    expect(screen.getByRole("list", { name: "Files" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <AttachmentList>
        <Attachment name="a.pdf" sizeText="1 MB" href="#a" onRemove={() => {}} />
        <Attachment name="b.pdf" status="uploading" progress={20} onRemove={() => {}} />
        <Attachment name="c.zip" status="error" onRemove={() => {}} />
        <Attachment variant="preview" name="d.png" thumbnail={<img src="d.png" alt="Preview of d" />} />
      </AttachmentList>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
