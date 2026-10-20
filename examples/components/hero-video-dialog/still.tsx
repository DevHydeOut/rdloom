import { HeroVideoDialog } from "@rdloom/react";

// isStill removes the hover zoom of the thumbnail. The dialog behaves the same.
export default function HeroVideoDialogStillExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-3xl">
        <HeroVideoDialog
          isStill
          title="Release notes walkthrough"
          videoSrc="/media/flower.mp4"
          poster={<img src="/media/highlands.jpg" alt="" className="size-full object-cover" />}
        />
      </div>
    </div>
  );
}
