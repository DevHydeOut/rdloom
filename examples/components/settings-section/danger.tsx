import { ActionButton, SettingsSection } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// tone="danger" marks a section with destructive actions. The action still asks, and the person types the name.
export default function SettingsSectionDangerExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl">
        <SettingsSection tone="danger" title="Delete workspace" description="This removes the workspace and everything in it for all members.">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--rd-color-text-default)]">Deleted workspaces cannot be restored.</p>
            <ActionButton
              variant="danger"
              onAction={() => wait(600)}
              confirm={{
                title: "Delete Brightwater?",
                description: "All projects, invoices and members are deleted at once.",
                confirmLabel: "Delete workspace",
                confirmText: "Brightwater",
              }}
            >
              Delete workspace
            </ActionButton>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
