import { Backlight } from "@rdloom/react";

// With no colors, the glow is a blurred, enlarged copy of the content, so it always matches it.
export default function BacklightFromContentExample() {
  return (
    <div className="flex w-full justify-center py-10">
      <Backlight intensity={0.7} blur={36}>
        <div
          role="img"
          aria-label="A sample picture drawn with a gradient"
          className="h-40 w-64 rounded-xl"
          style={{ background: "linear-gradient(120deg, #f97316, #eab308 45%, #22c55e)" }}
        />
      </Backlight>
    </div>
  );
}
