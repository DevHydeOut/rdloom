import { AppHeader, UserMenu } from "@rdloom/react";

// compact is 44 px high with smaller controls. This frame is narrow (24rem), so the search has folded to an icon
// with the same accessible name; in a wide frame it shows its text and the Ctrl K hint.
export default function AppHeaderCompactExample() {
  return (
    <div className="mx-auto w-96 max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <AppHeader size="compact" onSearch={() => {}} notificationCount={120} onNotifications={() => {}} userMenu={<UserMenu size="sm" user={{ name: "Ada Lovelace" }} onSignOut={async () => {}} />} />
      <div className="h-24" />
    </div>
  );
}
