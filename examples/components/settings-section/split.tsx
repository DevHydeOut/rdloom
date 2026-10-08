import { FormTextField, SettingsSection } from "@rdloom/react";

// orientation="split" puts the title in a left column beside the card from the md breakpoint up, and stacks on a phone.
export default function SettingsSectionSplitExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl">
        <SettingsSection
          orientation="split"
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
