import { Avatar } from "@rdloom/react";

export default function AvatarBasicExample() {
  return (
    <div className="flex items-center gap-3">
      <Avatar name="Ada Lovelace" />
      <Avatar name="Grace Hopper" shape="square" />
      <Avatar name="Linus" />
    </div>
  );
}
