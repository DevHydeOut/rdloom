import { Lens } from "@rdloom/react";

const picture = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0ea5e9"/><stop offset="1" stop-color="#22c55e"/></linearGradient></defs><rect width="480" height="300" fill="url(#g)"/><g fill="#fff" opacity="0.85"><rect x="40" y="40" width="40" height="40"/><rect x="100" y="40" width="20" height="20"/><rect x="40" y="100" width="20" height="20"/><rect x="330" y="200" width="90" height="60"/></g></svg>`,
)}`;

// A bigger lens with stronger zoom, for fine detail.
export default function LensSizeAndZoomExample() {
  return (
    <div className="flex w-full justify-center">
      <Lens zoom={3} size={160} className="rounded-[var(--rd-radius-overlay)]">
        <img src={picture} alt="Small white squares on a blue to green gradient" width={480} height={300} className="block h-auto w-full max-w-md" />
      </Lens>
    </div>
  );
}
