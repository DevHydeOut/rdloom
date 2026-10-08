import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Questionnaire, type QuestionnaireQuestion } from "../src";
import { axeViolations } from "./axe";

const questions: QuestionnaireQuestion[] = [
  { id: "role", type: "single", title: "Your role", required: true, options: [{ value: "dev", label: "Developer" }, { value: "design", label: "Designer" }] },
  { id: "goals", type: "multiple", title: "Goals", options: [{ value: "a", label: "Invite" }, { value: "b", label: "Import" }] },
  { id: "company", type: "text", title: "Company" },
  { id: "mood", type: "scale", title: "How is it going", lowLabel: "Badly", highLabel: "Well" },
];

describe("Questionnaire", () => {
  it("shows one question with progress", () => {
    render(<Questionnaire questions={questions} onSubmit={() => {}} />);
    expect(screen.getByRole("heading", { name: /Your role/ })).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "1");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
    expect(screen.queryByRole("button", { name: /Back/ })).toBeNull();
  });

  it("has no axe violations on a question and on the review", async () => {
    const user = userEvent.setup();
    render(<Questionnaire questions={questions} onSubmit={() => {}} defaultAnswers={{ role: "dev" }} />);
    expect(await axeViolations()).toEqual([]);
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: /Next|Review/ }));
    expect(screen.getByRole("heading", { name: "Review your answers" })).toBeInTheDocument();
    expect(await axeViolations()).toEqual([]);
  });

  it("blocks an empty required question, shows the error and moves focus to it", async () => {
    const user = userEvent.setup();
    render(<Questionnaire questions={questions} onSubmit={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Answer this question to continue.");
    expect(alert).toHaveFocus();
    expect(screen.getByRole("heading", { name: /Your role/ })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-describedby", alert.id);
  });

  it("moves focus to the new heading and announces the step", async () => {
    const user = userEvent.setup();
    render(<Questionnaire questions={questions} onSubmit={() => {}} />);
    await user.click(screen.getByRole("radio", { name: /Developer/ }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Goals" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Question 2 of 4");
  });

  it("keeps answers when going back", async () => {
    const user = userEvent.setup();
    render(<Questionnaire questions={questions} onSubmit={() => {}} />);
    await user.click(screen.getByRole("radio", { name: /Designer/ }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: /Designer/ })).toBeChecked();
  });

  it("takes a scale answer and supports arrow keys", async () => {
    const user = userEvent.setup();
    render(<Questionnaire questions={[questions[3]]} onSubmit={() => {}} />);
    await user.click(screen.getByRole("radio", { name: "2" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "3" })).toBeChecked();
  });

  it("reviews every answer, edits one and submits", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Questionnaire questions={questions} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("radio", { name: /Developer/ }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("checkbox", { name: /Invite/ }));
    await user.click(screen.getByRole("checkbox", { name: /Import/ }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByRole("textbox"), "Acme{Enter}");
    await user.click(screen.getByRole("radio", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "Review" }));

    expect(screen.getByText("Invite, Import")).toBeInTheDocument();
    expect(screen.getByText("4 of 5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit answer: Your role" }));
    expect(screen.getByRole("heading", { name: /Your role/ })).toHaveFocus();
    await user.click(screen.getByRole("radio", { name: /Designer/ }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledWith({ role: "design", goals: ["a", "b"], company: "Acme", mood: 4 });
  });

  it("offers Skip only on optional questions when allowed, and cancel when given", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Questionnaire questions={questions} onSubmit={() => {}} allowSkip onCancel={onCancel} defaultAnswers={{ role: "dev" }} />);
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("heading", { name: "Company" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
