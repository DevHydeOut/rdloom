import { Button } from "@rdloom/react";

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

export default function ButtonWithIconExample() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button>
        <PlusIcon /> New project
      </Button>
      {/* Icon-only buttons need a label for screen readers. */}
      <Button variant="ghost" aria-label="Add item">
        <PlusIcon />
      </Button>
    </div>
  );
}
