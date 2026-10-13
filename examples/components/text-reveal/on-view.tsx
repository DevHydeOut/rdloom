import { TextReveal } from "@rdloom/react";

export default function TextRevealOnViewExample() {
  return (
    <div className="flex w-full justify-center">
      <TextReveal mode="view" by="line" className="text-center text-lg font-medium">
        {"Simple to start.\nEasy to keep.\nHard to outgrow."}
      </TextReveal>
    </div>
  );
}
