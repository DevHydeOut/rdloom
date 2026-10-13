import { ThemeToggler } from "@rdloom/react";

// applyToDocument sets data-theme on the page root, so this switch changes the whole docs page.
export default function ThemeTogglerApplyToPageExample() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <ThemeToggler applyToDocument size="lg" />
      <p className="m-0 text-sm text-[var(--rd-color-text-muted)]">Sets data-theme on the document root. It does not remember the choice.</p>
    </div>
  );
}
