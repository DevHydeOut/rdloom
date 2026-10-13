import { VideoText } from "@rdloom/react";

// A public sample video (CC0) shows through the letters. Pass your own src. Until it loads, or for reduced motion,
// the letters show a gradient.
export default function VideoTextBasicExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <VideoText src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" className="px-4 text-8xl font-bold sm:text-9xl">Motion</VideoText>
    </div>
  );
}
