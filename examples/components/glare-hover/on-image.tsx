import { GlareHover } from "@rdloom/react";

export default function GlareHoverOnImageExample() {
  return (
    <div className="flex w-full justify-center">
      <GlareHover angle={-30} duration={0.9} className="h-40 w-64 rounded-[var(--rd-radius-overlay)]">
        <div
          role="img"
          aria-label="A blue and violet gradient"
          className="h-full w-full"
          style={{ background: "linear-gradient(135deg, #3b5bdb, #7048e8)" }}
        />
      </GlareHover>
    </div>
  );
}
