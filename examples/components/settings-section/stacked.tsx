import { FormTextField, SettingsSection } from "@rdloom/react";

// layout="stacked" keeps the title above the card at every width: good in a narrow column or a sheet.
export default function SettingsSectionStackedExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-xl">
        <SettingsSection
          layout="stacked"
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
