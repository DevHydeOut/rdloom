import { HeroVideoDialog } from "@rdloom/react";

// A sample video (CC0) and a photo, both served by this site from /media. Use your own files. The video is not
// requested until the dialog opens.
export default function HeroVideoDialogBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-3xl">
        <HeroVideoDialog
          title="Product tour"
          videoSrc="/media/flower.mp4"
          poster={<img src="/media/valley.jpg" alt="" className="size-full object-cover" />}
        />
      </div>
    </div>
  );
}
