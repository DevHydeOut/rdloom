import { IconCloud, BellIcon, ChartIcon, HomeIcon, InboxIcon, SettingsIcon, StarIcon, UsersIcon } from "@rdloom/react";

const icons = [
  ["Notifications", BellIcon],
  ["Reports", ChartIcon],
  ["Home", HomeIcon],
  ["Inbox", InboxIcon],
  ["Settings", SettingsIcon],
  ["Favourites", StarIcon],
  ["People", UsersIcon],
] as const;

// isPaused keeps the sphere still, for pages that do not want any movement.
export default function IconCloudStillExample() {
  return (
    <div className="flex w-full justify-center py-4">
      <IconCloud
        isPaused
        size={260}
        iconSize={36}
        label="Sample icons, still"
        items={icons.map(([label, Icon]) => ({ label, icon: <Icon className="size-6 text-[var(--rd-color-text-default)]" /> }))}
      />
    </div>
  );
}
