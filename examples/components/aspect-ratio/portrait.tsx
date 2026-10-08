import { AspectRatio } from "@rdloom/react";

export default function AspectRatioPortraitExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-40">
        <AspectRatio ratio="portrait" rounded>
          <div className="flex size-full items-end bg-gradient-to-b from-[var(--rd-color-surface-subtle)] to-[var(--rd-color-border-strong)] p-3 text-sm text-[var(--rd-color-text-default)]">
            3:4 cover
          </div>
        </AspectRatio>
      </div>
    </div>
  );
}
