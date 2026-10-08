import { useState } from "react";
import { Questionnaire, type QuestionnaireAnswers, type QuestionnaireQuestion } from "@rdloom/react";

const questions: QuestionnaireQuestion[] = [
  {
    id: "role",
    type: "single",
    title: "What best describes your role?",
    required: true,
    options: [
      { value: "design", label: "Design", description: "Interfaces, brand and prototypes" },
      { value: "engineering", label: "Engineering", description: "Building and shipping software" },
      { value: "product", label: "Product", description: "Planning and prioritising work" },
    ],
  },
  {
    id: "goals",
    type: "multiple",
    title: "What do you want to do first?",
    description: "Pick as many as you like.",
    options: [
      { value: "invite", label: "Invite my team" },
      { value: "import", label: "Import existing projects" },
      { value: "explore", label: "Look around" },
    ],
  },
  { id: "company", type: "text", title: "What is your company called?", placeholder: "Acme Ltd" },
  { id: "comfort", type: "scale", title: "How comfortable are you with tools like this?", lowLabel: "New to it", highLabel: "Very" },
];

export default function QuestionnaireOnboardingExample() {
  const [done, setDone] = useState<QuestionnaireAnswers | null>(null);
  return (
    <div className="flex w-full justify-center">
      {done ? (
        <p className="text-sm text-[var(--rd-color-text-default)]">Thanks, you are set up. We saved {Object.keys(done).length} answers.</p>
      ) : (
        <Questionnaire label="Welcome" questions={questions} onSubmit={setDone} submitLabel="Finish setup" />
      )}
    </div>
  );
}
