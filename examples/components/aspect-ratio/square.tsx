import { AspectRatio } from "@rdloom/react";

export default function AspectRatioSquareExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-48">
        <AspectRatio ratio="square" rounded>
          <div
            role="img"
            aria-label="Image placeholder"
            className="size-full bg-gradient-to-tr from-[var(--rd-color-action-primary)] to-[var(--rd-color-surface-subtle)]"
          />
        </AspectRatio>
      </div>
    </div>
  );
}
