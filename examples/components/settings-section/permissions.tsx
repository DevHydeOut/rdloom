import { FormTextField, SettingsSection } from "@rdloom/react";

// Shown but read-only: every field is disabled and the reason is text above the content.
// The server must still refuse the change: UI permission is not security.
export default function SettingsSectionPermissionsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl">
        <SettingsSection
          title="Company"
          description="Shown on your invoices."
          defaultValues={{ company: "Brightwater Supplies" }}
          onSave={async () => {}}
          permissions={{ edit: { state: "disabled", reason: "Only owners can change company details." } }}
        >
          <FormTextField name="company" label="Company name" />
        </SettingsSection>
      </div>
    </div>
  );
}
