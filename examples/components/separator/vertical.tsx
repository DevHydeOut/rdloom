import { Separator } from "@rdloom/react";

export default function SeparatorVerticalExample() {
  return (
    <div className="flex h-6 items-center gap-3 text-sm">
      <span>Docs</span>
      <Separator orientation="vertical" decorative />
      <span>Blog</span>
      <Separator orientation="vertical" decorative />
      <span>Changelog</span>
    </div>
  );
}
