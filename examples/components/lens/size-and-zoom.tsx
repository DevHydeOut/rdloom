import { Lens } from "@rdloom/react";

// A photo that this site serves from /media (from Unsplash, free to use). Use your own image.
const picture = "/media/highlands.jpg";

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
