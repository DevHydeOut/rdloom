import { Kbd } from "@rdloom/react";

// One Kbd per key; the plus signs are plain text.
export default function KbdChordExample() {
  return (
    <div className="flex items-center gap-1 text-sm text-[var(--rd-color-text-muted)]">
      <Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>P</Kbd>
    </div>
  );
}
