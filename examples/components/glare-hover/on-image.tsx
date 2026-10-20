import { GlareHover } from "@rdloom/react";

// On a photo or a dark surface, set the glare to white at low strength.
export default function GlareHoverOnImageExample() {
  return (
    <div className="flex w-full justify-center py-4">
      <GlareHover angle={-30} duration={0.9} color="rgb(255 255 255 / 0.45)" className="h-56 w-full max-w-md rounded-[var(--rd-radius-overlay)]">
        <img
          src="/media/highlands.jpg"
          alt="Green highlands under a cloudy sunrise with a winding road"
          className="size-full object-cover"
        />
      </GlareHover>
    </div>
  );
}
