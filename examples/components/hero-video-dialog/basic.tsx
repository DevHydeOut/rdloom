import { HeroVideoDialog } from "@rdloom/react";

// No video ships with the library. The src below is a placeholder for your own file, and it is not
// requested until the dialog opens.
export default function HeroVideoDialogBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-lg">
        <HeroVideoDialog
          title="Product tour"
          videoSrc="/media/product-tour.mp4"
          poster={<div className="size-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-amber-400" />}
        />
      </div>
    </div>
  );
}
