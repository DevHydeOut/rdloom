import { ActionButton, FormTextField, PageHeader, SettingsRow, SettingsSection, Switch } from "@rdloom/react";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// A whole settings page from the blocks: PageHeader, a form section, a toggle list and a danger zone.
export default function SettingsPageExample() {
  return (
    <div className="flex w-full justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <PageHeader title="Settings" description="Manage your profile and how we contact you." border />
        <SettingsSection
          title="Profile"
          description="Your name and the email address we write to."
          defaultValues={{ name: "Lena Fischer", email: "lena.fischer@example.com" }}
          onSave={() => wait(600)}
        >
          <div className="flex flex-col gap-4">
            <FormTextField name="name" label="Name" isRequired />
            <FormTextField name="email" label="Email" type="email" isRequired />
          </div>
        </SettingsSection>
        <SettingsSection title="Notifications" description="Choose what we email you about.">
          <SettingsRow label="Weekly summary" description="A short email every Monday.">
            {({ descriptionId }) => <Switch aria-describedby={descriptionId} defaultSelected><span className="sr-only">Weekly summary</span></Switch>}
          </SettingsRow>
          <SettingsRow label="Invoices" description="When a new invoice is ready.">
            {({ descriptionId }) => <Switch aria-describedby={descriptionId} defaultSelected><span className="sr-only">Invoices</span></Switch>}
          </SettingsRow>
          <SettingsRow label="Product news" description="New features, once or twice a month.">
            {({ descriptionId }) => <Switch aria-describedby={descriptionId}><span className="sr-only">Product news</span></Switch>}
          </SettingsRow>
        </SettingsSection>
        <SettingsSection tone="danger" title="Delete account" description="Removes your account and your personal data.">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--rd-color-text-default)]">This cannot be undone.</p>
            <ActionButton
              variant="danger"
              onAction={() => wait(600)}
              confirm={{ title: "Delete your account?", description: "Your data is removed at once.", confirmLabel: "Delete account", confirmText: "delete" }}
            >
              Delete account
            </ActionButton>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
