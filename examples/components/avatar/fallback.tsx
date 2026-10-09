import { Avatar } from "@rdloom/react";

// A missing or broken image falls back to the initials. When the name is already
// written next to the avatar, `decorative` keeps screen readers from saying it twice.
export default function AvatarFallbackExample() {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center gap-2">
        <Avatar name="Katherine Johnson" src="data:image/png;base64,AAAA" />
        <span>Image fails to load</span>
      </div>
      <div className="flex items-center gap-2">
        <Avatar name="Margaret Hamilton" decorative />
        <span>Margaret Hamilton</span>
      </div>
    </div>
  );
}
