import { SpinningText } from "@rdloom/react";

// The ring is a plain box, so anything can sit in the middle of it.
export default function SpinningTextAroundAnIconExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative inline-flex items-center justify-center text-xs font-medium uppercase">
        <SpinningText radius={56}>new release • read the notes • </SpinningText>
        <span
          aria-hidden="true"
          className="absolute size-10 rounded-full"
          style={{ background: "linear-gradient(135deg, var(--rd-color-action-primary), var(--rd-color-surface-subtle))" }}
        />
      </div>
    </div>
  );
}
