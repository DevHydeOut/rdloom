import { AppHeader, UserMenu } from "@rdloom/react";

// classNames restyles one part without editing the file: a tinted bar, a pill-shaped search and a square badge.
export default function AppHeaderClassNamesExample() {
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <AppHeader
        onSearch={() => {}}
        notificationCount={5}
        onNotifications={() => {}}
        userMenu={<UserMenu user={{ name: "Ada Lovelace" }} onSignOut={async () => {}} />}
        classNames={{
          root: "bg-[var(--rd-color-surface-subtle)]",
          search: "!rounded-full",
          badge: "!rounded-md",
        }}
      />
      <div className="h-24" />
    </div>
  );
}
