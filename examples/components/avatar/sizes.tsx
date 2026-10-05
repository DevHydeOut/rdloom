import { Avatar } from "@rdloom/react";

export default function AvatarSizesExample() {
  return (
    <div className="flex items-end gap-3">
      <Avatar name="Ada Lovelace" size="xs" />
      <Avatar name="Ada Lovelace" size="sm" />
      <Avatar name="Ada Lovelace" size="md" />
      <Avatar name="Ada Lovelace" size="lg" />
    </div>
  );
}
