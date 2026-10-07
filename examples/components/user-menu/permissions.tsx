import { CreditCardIcon, SettingsIcon, UserMenu } from "@rdloom/react";

// The app decides what each person may do. Billing is hidden for this person, Team settings is shown with the reason,
// and Sign out is allowed. The server must still check every request: this only changes what people see.
export default function UserMenuPermissionsExample() {
  return (
    <div className="flex justify-center p-8 pb-56">
      <UserMenu
        user={{ name: "Grace Hopper", email: "grace@example.com" }}
        groups={[
          {
            label: "Account",
            items: [
              { id: "settings", label: "Settings", icon: <SettingsIcon />, href: "/settings" },
              { id: "billing", label: "Billing", icon: <CreditCardIcon />, href: "/billing", permission: "hidden" },
            ],
          },
          {
            label: "Workspace",
            items: [{ id: "team", label: "Team settings", permission: { state: "disabled", reason: "Only owners can change this" } }],
          },
        ]}
        onSignOut={async () => {}}
      />
    </div>
  );
}
