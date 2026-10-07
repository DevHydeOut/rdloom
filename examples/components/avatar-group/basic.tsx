import { AvatarGroup } from "@rdloom/react";

export default function AvatarGroupBasicExample() {
  return (
    <AvatarGroup
      label="Team members"
      avatars={[{ name: "Ada Lovelace" }, { name: "Grace Hopper" }, { name: "Katherine Johnson" }]}
    />
  );
}
