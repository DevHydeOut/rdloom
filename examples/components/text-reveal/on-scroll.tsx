import { TextReveal } from "@rdloom/react";

// Scroll the box: each word comes to full strength as the passage moves up.
export default function TextRevealOnScrollExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="h-56 w-80 overflow-y-auto rounded-lg border border-[var(--rd-color-border-default)] p-4">
        <div className="h-40" aria-hidden="true" />
        <TextReveal className="text-xl font-medium leading-snug">
          Good software feels like it was made for you. Every word here arrives as you scroll to it.
        </TextReveal>
        <div className="h-48" aria-hidden="true" />
      </div>
    </div>
  );
}
