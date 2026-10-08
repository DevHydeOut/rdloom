import { useState } from "react";
import { Questionnaire, type QuestionnaireAnswers, type QuestionnaireQuestion } from "@rdloom/react";

const questions: QuestionnaireQuestion[] = [
  { id: "name", type: "text", title: "What should we call you?", required: true },
  {
    id: "source",
    type: "single",
    title: "How did you hear about us?",
    description: "You can skip this one.",
    options: [
      { value: "friend", label: "A friend" },
      { value: "search", label: "A web search" },
      { value: "event", label: "An event" },
    ],
  },
  { id: "rating", type: "scale", title: "How was signing up?", lowLabel: "Hard", highLabel: "Easy" },
];

export default function QuestionnaireWithSkipExample() {
  const [result, setResult] = useState<QuestionnaireAnswers | null>(null);
  return (
    <div className="flex w-full justify-center">
      {result ? (
        <p className="text-sm text-[var(--rd-color-text-default)]">Saved: {JSON.stringify(result)}</p>
      ) : (
        <Questionnaire label="Quick survey" questions={questions} allowSkip onSubmit={setResult} />
      )}
    </div>
  );
}
