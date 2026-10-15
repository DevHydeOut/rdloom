import { VideoText } from "@rdloom/react";

// A sample video (CC0, served from /media) shows through the letters. Pass your own src. Until it loads, or for reduced motion,
// the letters show a gradient.
export default function VideoTextBasicExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <VideoText src="/media/flower.mp4" className="px-4 text-8xl font-bold sm:text-9xl">Motion</VideoText>
    </div>
  );
}
