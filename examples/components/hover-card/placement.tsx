import { HoverCard, HoverCardContent, HoverCardTrigger } from "@rdloom/react";

export default function HoverCardPlacementExample() {
  return (
    <div className="flex flex-wrap justify-center gap-8 p-10 text-sm">
      {(["top", "bottom", "start", "end"] as const).map((placement) => (
        <HoverCard key={placement} placement={placement}>
          <HoverCardTrigger href={`#${placement}`}>Opens {placement}</HoverCardTrigger>
          <HoverCardContent label={`Preview placed ${placement}`}>
            <p>This card prefers the {placement} side and flips when there is no room.</p>
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );
}
