import { PixelImage } from "@rdloom/react";

// A photo that this site serves from /media (from Unsplash, free to use). Use your own image.
const picture = "/media/valley.jpg";

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
