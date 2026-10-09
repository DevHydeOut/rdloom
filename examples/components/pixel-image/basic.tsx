import { PixelImage } from "@rdloom/react";

const picture = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ec4899"/><stop offset="0.5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient></defs><rect width="480" height="300" fill="url(#g)"/><circle cx="240" cy="150" r="70" fill="#fff" opacity="0.85"/></svg>`,
)}`;

// The sharp image is in the page from the start. The blocks are drawn over it and fade away in about a second.
export default function PixelImageBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <PixelImage src={picture} alt="A white disc on a pink to blue gradient" className="w-full max-w-md rounded-[var(--rd-radius-overlay)]" />
    </div>
  );
}
