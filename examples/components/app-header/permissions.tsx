import { AppHeader, UserMenu } from "@rdloom/react";

// The app decides what each person may do. Search is allowed, notifications are shown but explained.
// The server must still check every request: this only changes what people see.
export default function AppHeaderPermissionsExample() {
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <AppHeader
        onSearch={() => {}}
        onNotifications={() => {}}
        permissions={{ notifications: { state: "disabled", reason: "Notifications are off for guests" } }}
        userMenu={<UserMenu user={{ name: "Guest user" }} onSignOut={async () => {}} />}
      />
      <div className="h-24" />
    </div>
  );
}
