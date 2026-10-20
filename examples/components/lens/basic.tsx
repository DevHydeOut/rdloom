import { Lens } from "@rdloom/react";

// A photo that this site serves from /media (from Unsplash, free to use). Use your own image.
const picture = "/media/valley.jpg";

// Move the mouse over the picture. The image keeps its alt text and the lens is hidden from screen readers.
export default function LensBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <Lens className="rounded-[var(--rd-radius-overlay)]">
        <img src={picture} alt="A misty valley with pine trees and a river at sunrise" width={1200} height={800} className="block h-auto w-full max-w-xl" />
      </Lens>
    </div>
  );
}
