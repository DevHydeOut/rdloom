import { PixelImage } from "@rdloom/react";

const picture = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f97316"/><stop offset="1" stop-color="#1e1b4b"/></linearGradient></defs><rect width="480" height="300" fill="url(#g)"/><path d="M0 240 L120 150 L200 210 L320 110 L480 250 L480 300 L0 300 Z" fill="#fff" opacity="0.8"/></svg>`,
)}`;

// Pass your own image element when you need a width, a height, srcSet or object-fit.
export default function PixelImageChildrenExample() {
  return (
    <div className="flex w-full justify-center">
      <PixelImage className="w-full max-w-md rounded-[var(--rd-radius-overlay)]">
        <img src={picture} alt="White mountain peaks against an orange to navy sky" width={480} height={300} className="block h-64 w-full object-cover" />
      </PixelImage>
    </div>
  );
}
