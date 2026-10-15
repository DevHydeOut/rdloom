import { IconCloud, BellIcon, CalendarIcon, ChartIcon, ClockIcon, FileIcon, HomeIcon, ImageIcon, InboxIcon, SearchIcon, SettingsIcon, StarIcon, TagIcon, UsersIcon } from "@rdloom/react";

const icons = [
  ["Notifications", BellIcon],
  ["Calendar", CalendarIcon],
  ["Reports", ChartIcon],
  ["Schedule", ClockIcon],
  ["Files", FileIcon],
  ["Home", HomeIcon],
  ["Images", ImageIcon],
  ["Inbox", InboxIcon],
  ["Search", SearchIcon],
  ["Settings", SettingsIcon],
  ["Favourites", StarIcon],
  ["Tags", TagIcon],
  ["People", UsersIcon],
] as const;

export default function IconCloudBasicExample() {
  return (
    <div className="flex w-full justify-center py-4">
      <IconCloud
        size={300}
        iconSize={36}
        label="Sample icons"
        items={icons.map(([label, Icon]) => ({ label, icon: <Icon className="size-6 text-[var(--rd-color-text-default)]" /> }))}
      />
    </div>
  );
}
