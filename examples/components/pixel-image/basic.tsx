import { PixelImage } from "@rdloom/react";

// A free-to-use photo from Unsplash. Swap in your own image.
const picture = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80";

// The sharp image is in the page from the start. The blocks are drawn over it and fade away in about a second.
export default function PixelImageBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <PixelImage src={picture} alt="Green highlands under a cloudy sunrise with a winding road" className="w-full max-w-xl rounded-[var(--rd-radius-overlay)]" />
    </div>
  );
}
