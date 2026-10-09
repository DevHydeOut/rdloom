import { Lens } from "@rdloom/react";

const picture = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><rect width="480" height="300" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-width="2" opacity="0.8"><circle cx="150" cy="150" r="60"/><circle cx="150" cy="150" r="30"/><path d="M260 80h160M260 120h120M260 160h140M260 200h90"/></g></svg>`,
)}`;

// Move the mouse over the picture. The image keeps its alt text and the lens is hidden from screen readers.
export default function LensBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <Lens className="rounded-[var(--rd-radius-overlay)]">
        <img src={picture} alt="Concentric circles beside four short lines on a purple to amber gradient" width={480} height={300} className="block h-auto w-full max-w-md" />
      </Lens>
    </div>
  );
}
