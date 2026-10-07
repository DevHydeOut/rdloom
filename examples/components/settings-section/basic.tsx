import { FormTextField, SettingsSection } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The Save and Cancel bar appears only after a change. Your onSave does the real work.
export default function SettingsSectionBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl">
        <SettingsSection
          title="Profile"
          description="Your name and the email address we write to."
          defaultValues={{ name: "Lena Fischer", email: "lena.fischer@example.com" }}
          onSave={async () => {
            await wait(600);
          }}
        >
          <div className="flex flex-col gap-4">
            <FormTextField name="name" label="Name" isRequired />
            <FormTextField name="email" label="Email" type="email" isRequired />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
