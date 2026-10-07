import { SettingsRow, SettingsSection, Switch } from "@rdloom/react";

// Without onSave there is no footer: each switch applies at once, so your handler saves it.
export default function SettingsSectionTogglesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl">
        <SettingsSection title="Notifications" description="Choose what we email you about.">
          <SettingsRow label="Weekly summary" description="A short email every Monday with what changed.">
            {({ descriptionId }) => <Switch aria-describedby={descriptionId} defaultSelected><span className="sr-only">Weekly summary</span></Switch>}
          </SettingsRow>
          <SettingsRow label="Invoices" description="When a new invoice is ready.">
            {({ descriptionId }) => <Switch aria-describedby={descriptionId} defaultSelected><span className="sr-only">Invoices</span></Switch>}
          </SettingsRow>
          <SettingsRow label="Product news" description="New features, once or twice a month.">
            {({ descriptionId }) => <Switch aria-describedby={descriptionId}><span className="sr-only">Product news</span></Switch>}
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
