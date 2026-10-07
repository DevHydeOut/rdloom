import { AvatarGroup } from "@rdloom/react";

export default function AvatarGroupWithOverflowExample() {
  return (
    <AvatarGroup
      label="Team members"
      max={3}
      avatars={[
        { name: "Ada Lovelace" },
        { name: "Grace Hopper" },
        { name: "Katherine Johnson" },
        { name: "Margaret Hamilton" },
        { name: "Hedy Lamarr" },
      ]}
    />
  );
}
