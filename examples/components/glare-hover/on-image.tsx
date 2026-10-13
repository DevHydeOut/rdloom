import { GlareHover } from "@rdloom/react";

// On a photo or a dark surface, set the glare to white at low strength.
export default function GlareHoverOnImageExample() {
  return (
    <div className="flex w-full justify-center py-4">
      <GlareHover angle={-30} duration={0.9} color="rgb(255 255 255 / 0.45)" className="h-56 w-full max-w-md rounded-[var(--rd-radius-overlay)]">
        <img
          src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80"
          alt="Green highlands under a cloudy sunrise with a winding road"
          className="size-full object-cover"
        />
      </GlareHover>
    </div>
  );
}
