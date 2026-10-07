import { FormTextField, SettingsSection } from "@rdloom/react";

// Restyle single parts without editing the file: here a flat card, a plain footer and a pill Save button.
export default function SettingsSectionClassNamesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl">
        <SettingsSection
          title="Display name"
          description="How your name appears to others."
          defaultValues={{ name: "Lena" }}
          onSave={async () => {}}
          classNames={{
            card: "[box-shadow:none] border-dashed",
            footer: "bg-[var(--rd-color-surface-default)]",
            saveButton: "rounded-full",
            title: "tracking-tight",
          }}
        >
          <FormTextField name="name" label="Name" />
        </SettingsSection>
      </div>
    </div>
  );
}
