import { Backlight } from "@rdloom/react";

export default function BacklightWithColorsExample() {
  return (
    <div className="flex w-full justify-center py-10">
      <Backlight colors={["#7c5cff", "#22d3ee", "#f472b6"]} intensity={0.55} blur={44}>
        <div
          role="img"
          aria-label="A sample picture drawn with a gradient"
          className="h-40 w-64 rounded-xl"
          style={{ background: "linear-gradient(135deg, #1e293b, #475569)" }}
        />
      </Backlight>
    </div>
  );
}
