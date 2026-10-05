import { Kbd } from "@rdloom/react";

export default function KbdInTextExample() {
  return (
    <p className="max-w-sm text-sm">
      Press <Kbd size="sm">?</Kbd> anywhere to see every shortcut, or <Kbd size="sm">Esc</Kbd> to close this panel.
    </p>
  );
}
