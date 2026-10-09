import { TypingAnimation } from "@rdloom/react";

// Loops after a short pause. Use the Still switch, or isPaused, to stop it.
export default function TypingAnimationLoopingExample() {
  return (
    <div className="flex w-full justify-center">
      <code className="rounded-md bg-[var(--rd-color-surface-subtle)] px-3 py-2 text-sm">
        <TypingAnimation loop speed={90}>
          npx rdloom add typing-animation
        </TypingAnimation>
      </code>
    </div>
  );
}
