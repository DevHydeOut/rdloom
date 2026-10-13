import { Lens } from "@rdloom/react";

// A free-to-use photo from Unsplash. Swap in your own image.
const picture = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80";

// A bigger lens with stronger zoom, for fine detail.
export default function LensSizeAndZoomExample() {
  return (
    <div className="flex w-full justify-center">
      <Lens zoom={3} size={160} className="rounded-[var(--rd-radius-overlay)]">
        <img src={picture} alt="Green highlands under a cloudy sunrise with a winding road" width={1200} height={800} className="block h-auto w-full max-w-xl" />
      </Lens>
    </div>
  );
}
