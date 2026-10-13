import { WordRotate } from "@rdloom/react";

export default function WordRotateBasicExample() {
  return (
    <div className="flex w-full justify-center text-2xl font-semibold">
      <p>
        Built for <WordRotate className="text-[var(--rd-color-action-primary)]" words={["teams", "makers", "studios", "everyone"]} />
      </p>
    </div>
  );
}
