import { HeroVideoDialog } from "@rdloom/react";

// A public sample video (CC0) and a free Unsplash photo as the thumbnail. Use your own files. The video is not
// requested until the dialog opens.
export default function HeroVideoDialogBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-3xl">
        <HeroVideoDialog
          title="Product tour"
          videoSrc="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          poster={<img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80" alt="" className="size-full object-cover" />}
        />
      </div>
    </div>
  );
}
