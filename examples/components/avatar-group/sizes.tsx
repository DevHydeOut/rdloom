import { AvatarGroup } from "@rdloom/react";

const people = [{ name: "Ada Lovelace" }, { name: "Grace Hopper" }, { name: "Katherine Johnson" }, { name: "Hedy Lamarr" }];

export default function AvatarGroupSizesExample() {
  return (
    <div className="flex flex-col items-start gap-3">
      <AvatarGroup label="Reviewers" size="xs" max={3} avatars={people} />
      <AvatarGroup label="Reviewers" size="sm" max={3} avatars={people} />
      <AvatarGroup label="Reviewers" size="md" max={3} avatars={people} />
      <AvatarGroup label="Reviewers" size="lg" max={3} avatars={people} />
    </div>
  );
}
