import { ShineBorder } from "@rdloom/react";

export default function ShineBorderBasicExample() {
  return (
    <ShineBorder className="w-72 rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5">
      <h3 className="font-semibold">Team plan</h3>
      <p className="pt-1 text-sm text-[var(--rd-color-text-muted)]">Shared workspaces and single sign-on.</p>
    </ShineBorder>
  );
}
