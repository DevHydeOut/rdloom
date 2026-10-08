import { AspectRatio } from "@rdloom/react";

export default function AspectRatioVideoExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-[28rem] max-w-full">
        <AspectRatio ratio="video" rounded>
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--rd-color-surface-subtle)] to-[var(--rd-color-border-default)] text-sm text-[var(--rd-color-text-muted)]">
            16:9 video area
          </div>
        </AspectRatio>
      </div>
    </div>
  );
}
