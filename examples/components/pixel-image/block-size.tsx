import { PixelImage } from "@rdloom/react";

const picture = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><defs><linearGradient id="g" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14b8a6"/><stop offset="1" stop-color="#facc15"/></linearGradient></defs><rect width="480" height="300" fill="url(#g)"/><g fill="#0f172a" opacity="0.75"><rect x="60" y="60" width="120" height="30"/><rect x="60" y="110" width="200" height="30"/><rect x="60" y="160" width="160" height="30"/></g></svg>`,
)}`;

// Bigger first blocks and a longer resolve make the effect easier to see.
export default function PixelImageBlockSizeExample() {
  return (
    <div className="flex w-full justify-center">
      <PixelImage src={picture} alt="Three dark bars on a teal to yellow gradient" blockSize={64} duration={2} className="w-full max-w-md rounded-[var(--rd-radius-overlay)]" />
    </div>
  );
}
