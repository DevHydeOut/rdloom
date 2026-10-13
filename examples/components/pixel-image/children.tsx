import { PixelImage } from "@rdloom/react";

// A free-to-use photo from Unsplash. Swap in your own image.
const picture = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";

// Pass your own image element when you need a width, a height, srcSet or object-fit.
export default function PixelImageChildrenExample() {
  return (
    <div className="flex w-full justify-center">
      <PixelImage className="w-full max-w-xl rounded-[var(--rd-radius-overlay)]">
        <img src={picture} alt="A misty valley with pine trees and a river at sunrise" width={1200} height={800} className="block h-64 w-full object-cover" />
      </PixelImage>
    </div>
  );
}
