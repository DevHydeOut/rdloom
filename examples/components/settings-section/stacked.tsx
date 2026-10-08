import { FormTextField, SettingsSection } from "@rdloom/react";

// orientation="stacked" (the default) keeps the title above the card at every width.
export default function SettingsSectionStackedExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-xl">
        <SettingsSection
          orientation="stacked"
          title="Company"
          description="Shown on your invoices."
          defaultValues={{ company: "Brightwater Supplies", vat: "" }}
          onSave={async () => {}}
        >
          <div className="flex flex-col gap-4">
            <FormTextField name="company" label="Company name" isRequired />
            <FormTextField name="vat" label="Tax number" description="Optional." />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
