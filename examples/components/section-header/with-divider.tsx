import { Button, SectionHeader } from "@rdloom/react";

export default function SectionHeaderWithDividerExample() {
  return (
    <div className="flex min-h-[12rem] w-full items-center justify-center">
      <div className="w-full max-w-3xl">
        <SectionHeader title="Team members" description="People who can sign in to this workspace." divider actions={<Button size="sm">Invite</Button>} />
        <p className="pt-4 text-sm text-[var(--rd-color-text-muted)]">The table or form for this section goes here.</p>
      </div>
    </div>
  );
}
