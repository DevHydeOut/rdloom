import { Marquee } from "@rdloom/react";

const quotes = ["Setup took ten minutes.", "Our forms finally pass audits.", "Support answered the same day.", "The keyboard flow just works."];

export default function MarqueeWithPauseButtonExample() {
  return (
    <div className="flex w-full justify-center">
      <Marquee showPauseButton reverse speed={30} className="w-full max-w-md">
        {quotes.map((quote) => (
          <span key={quote} className="whitespace-nowrap rounded-lg bg-[var(--rd-color-surface-subtle)] px-4 py-2 text-sm">
            {quote}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
