import { VideoText } from "@rdloom/react";

export default function VideoTextPausedExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <VideoText isPaused src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" className="px-4 text-8xl font-bold sm:text-9xl">
        Still
      </VideoText>
    </div>
  );
}
