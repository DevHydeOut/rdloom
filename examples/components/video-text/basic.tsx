import { VideoText } from "@rdloom/react";

// Pass src="/your-video.mp4" to show your own video through the letters.
// Without it, the gradient fallback below is shown.
export default function VideoTextBasicExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <VideoText className="px-4 text-7xl">Motion</VideoText>
    </div>
  );
}
