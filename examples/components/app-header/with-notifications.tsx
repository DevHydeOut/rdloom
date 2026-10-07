import { useState } from "react";
import { AppHeader, UserMenu } from "@rdloom/react";

// The unread count is drawn as a number and read with the button: "Notifications, 3 unread". Opening the panel marks them read.
export default function AppHeaderWithNotificationsExample() {
  const [unread, setUnread] = useState(3);
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <AppHeader
        onSearch={() => {}}
        notificationCount={unread}
        onNotifications={() => setUnread(0)}
        userMenu={<UserMenu user={{ name: "Ada Lovelace", email: "ada@example.com" }} onSignOut={async () => {}} />}
      />
      <p className="p-4 text-sm text-[var(--rd-color-text-muted)]">{unread > 0 ? `${unread} unread notifications` : "All caught up"}</p>
    </div>
  );
}
