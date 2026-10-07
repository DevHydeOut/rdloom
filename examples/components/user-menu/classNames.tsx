import { SettingsIcon, UserMenu } from "@rdloom/react";

// classNames restyles one part without editing the file: a square avatar button, a wider popover and a tinted header.
export default function UserMenuClassNamesExample() {
  return (
    <div className="flex justify-center p-8 pb-48">
      <UserMenu
        user={{ name: "Ada Lovelace", email: "ada@example.com" }}
        items={[{ id: "settings", label: "Settings", icon: <SettingsIcon />, href: "/settings" }]}
        onSignOut={async () => {}}
        showName
        classNames={{
          trigger: "border border-[var(--rd-color-border-default)] pe-3",
          popover: "min-w-72",
          header: "bg-[var(--rd-color-surface-subtle)]",
          item: "data-[focused]:bg-[var(--rd-color-surface-selected)]",
        }}
      />
    </div>
  );
}
