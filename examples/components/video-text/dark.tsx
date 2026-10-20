import { VideoText } from "@rdloom/react";

export default function VideoTextDarkExample() {
  return (
    <div className="flex w-full justify-center bg-black py-6">
      <VideoText tone="dark" src="/media/flower.mp4" fallback="linear-gradient(90deg, #f472b6, #facc15)" className="px-4 text-8xl font-bold sm:text-9xl">
        Night
      </VideoText>
    </div>
  );
}
