import { PixelImage } from "@rdloom/react";

// A photo that this site serves from /media (from Unsplash, free to use). Use your own image.
const picture = "/media/highlands.jpg";

// The sharp image is in the page from the start. The blocks are drawn over it and fade away in about a second.
export default function PixelImageBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <PixelImage src={picture} alt="Green highlands under a cloudy sunrise with a winding road" className="w-full max-w-xl rounded-[var(--rd-radius-overlay)]" />
    </div>
  );
}
