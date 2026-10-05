import { Kbd } from "@rdloom/react";

export default function KbdBasicExample() {
  return (
    <div className="flex items-center gap-2">
      <Kbd>Esc</Kbd>
      <Kbd>Enter</Kbd>
      <Kbd>Tab</Kbd>
    </div>
  );
}
