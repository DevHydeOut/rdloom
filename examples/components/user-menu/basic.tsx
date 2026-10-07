import { SettingsIcon, UserIcon, UserMenu } from "@rdloom/react";

// The button shows the picture (or initials). The menu is named with the person's name.
export default function UserMenuBasicExample() {
  return (
    <div className="flex justify-center p-8 pb-48">
      <UserMenu
        user={{ name: "Ada Lovelace", email: "ada@example.com" }}
        items={[
          { id: "profile", label: "Your profile", icon: <UserIcon />, href: "/profile" },
          { id: "settings", label: "Settings", icon: <SettingsIcon />, href: "/settings" },
        ]}
        onSignOut={async () => {
          // Call your sign-out API here.
        }}
      />
    </div>
  );
}
