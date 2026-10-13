import { SmoothCursor } from "@rdloom/react";

export default function SmoothCursorPageWideExample() {
  return (
    <div className="flex w-full justify-center">
      <SmoothCursor scope="page" size={14} color="var(--rd-color-action-primary)" />
      <p className="max-w-sm text-center text-sm text-[var(--rd-color-text-muted)]">
        With scope set to page, a small dot trails the pointer everywhere in the window. Touch and reduced motion never see it.
      </p>
    </div>
  );
}
