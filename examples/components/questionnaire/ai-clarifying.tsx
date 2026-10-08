import { useState } from "react";
import { Questionnaire, type QuestionnaireAnswers, type QuestionnaireQuestion } from "@rdloom/react";

const questions: QuestionnaireQuestion[] = [
  {
    id: "format",
    type: "single",
    title: "Which format should the report use?",
    required: true,
    options: [
      { value: "summary", label: "One-page summary" },
      { value: "detailed", label: "Detailed, with tables" },
    ],
  },
  {
    id: "period",
    type: "single",
    title: "Which period should it cover?",
    required: true,
    options: [
      { value: "month", label: "Last month" },
      { value: "quarter", label: "Last quarter" },
      { value: "year", label: "Last 12 months" },
    ],
  },
  {
    id: "include",
    type: "multiple",
    title: "What should it include?",
    options: [
      { value: "revenue", label: "Revenue" },
      { value: "refunds", label: "Refunds" },
      { value: "churn", label: "Churn" },
    ],
  },
  { id: "notes", type: "text", title: "Anything else I should know?", placeholder: "Optional" },
];

export default function QuestionnaireAiClarifyingExample() {
  const [sent, setSent] = useState<QuestionnaireAnswers | null>(null);
  return (
    <div className="flex w-full justify-center">
      {sent ? (
        <p className="text-sm text-[var(--rd-color-text-default)]">Sent to the assistant: {JSON.stringify(sent)}</p>
      ) : (
        <Questionnaire label="A few questions before I start" questions={questions} onSubmit={setSent} onCancel={() => setSent({})} submitLabel="Send answers" />
      )}
    </div>
  );
}
