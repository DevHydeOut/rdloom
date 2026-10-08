import { ScrollArea } from "@rdloom/react";

const items = Array.from({ length: 20 }, (_, i) => `Deployment ${i + 1}`);

export default function ScrollAreaVerticalListExample() {
  return (
    <div className="flex w-full justify-center">
      <ScrollArea label="Recent deployments" className="h-56 w-full max-w-sm border border-[var(--rd-color-border-default)]">
        <ul className="flex flex-col">
          {items.map((name) => (
            <li key={name} className="border-b border-[var(--rd-color-border-default)] px-4 py-3 text-sm last:border-b-0">
              {name}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
