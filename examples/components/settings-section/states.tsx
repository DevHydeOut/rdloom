import { FormTextField, SettingsSection } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A failed save keeps what was typed, focuses the error summary and links each problem to its field.
// Return { fieldErrors } for a problem on a field and { formError } for the whole section.
export default function SettingsSectionStatesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-xl flex-col gap-10">
        <SettingsSection
          orientation="stacked"
          title="Billing email"
          description="Try saving a changed address: the server refuses it."
          defaultValues={{ email: "billing@example.com" }}
          onSave={async () => {
            await wait(500);
            return { fieldErrors: { email: "That address is already used by another workspace." } };
          }}
        >
          <FormTextField name="email" label="Email" type="email" isRequired />
        </SettingsSection>
        <SettingsSection
          orientation="stacked"
          title="Time zone"
          description="Try saving a change: the server is unavailable."
          defaultValues={{ zone: "Europe/Berlin" }}
          onSave={async () => {
            await wait(500);
            return { formError: "We could not save your settings. Nothing was changed, so try again." };
          }}
        >
          <FormTextField name="zone" label="Time zone" />
        </SettingsSection>
      </div>
    </div>
  );
}
