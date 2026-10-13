import { Marquee } from "@rdloom/react";

const names = ["Northwind", "Harbor Labs", "Lumen", "Fieldnote", "Orchard", "Tessera"];

export default function MarqueeBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <Marquee className="w-full">
        {names.map((name) => (
          <span key={name} className="rounded-full border border-[var(--rd-color-border-default)] px-4 py-1.5 text-sm">
            {name}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
