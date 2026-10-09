import { HeroVideoDialog } from "@rdloom/react";

// isStill removes the hover zoom of the thumbnail. The dialog behaves the same.
export default function HeroVideoDialogStillExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-lg">
        <HeroVideoDialog
          isStill
          title="Release notes walkthrough"
          videoSrc="/media/release-notes.mp4"
          poster={<div className="size-full bg-gradient-to-bl from-rose-500 to-violet-600" />}
        />
      </div>
    </div>
  );
}
