import { PixelImage } from "@rdloom/react";

// A photo that this site serves from /media (from Unsplash, free to use). Use your own image.
const picture = "/media/valley.jpg";

// Bigger first blocks and a longer resolve make the effect easier to see.
export default function PixelImageBlockSizeExample() {
  return (
    <div className="flex w-full justify-center">
      <PixelImage src={picture} alt="A misty valley with pine trees and a river at sunrise" blockSize={64} duration={2} className="w-full max-w-xl rounded-[var(--rd-radius-overlay)]" />
    </div>
  );
}
