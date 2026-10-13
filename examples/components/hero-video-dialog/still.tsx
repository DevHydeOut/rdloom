import { HeroVideoDialog } from "@rdloom/react";

// isStill removes the hover zoom of the thumbnail. The dialog behaves the same.
export default function HeroVideoDialogStillExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-3xl">
        <HeroVideoDialog
          isStill
          title="Release notes walkthrough"
          videoSrc="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          poster={<img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80" alt="" className="size-full object-cover" />}
        />
      </div>
    </div>
  );
}
