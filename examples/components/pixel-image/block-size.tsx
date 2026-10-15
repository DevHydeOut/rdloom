import { PixelImage } from "@rdloom/react";

// A free-to-use photo from Unsplash. Swap in your own image.
const picture = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";

// Bigger first blocks and a longer resolve make the effect easier to see.
export default function PixelImageBlockSizeExample() {
  return (
    <div className="flex w-full justify-center">
      <PixelImage src={picture} alt="A misty valley with pine trees and a river at sunrise" blockSize={64} duration={2} className="w-full max-w-xl rounded-[var(--rd-radius-overlay)]" />
    </div>
  );
}
