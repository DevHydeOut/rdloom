import { Button, Tooltip, TooltipTrigger } from "@rdloom/react";

export default function TooltipPlacementsExample() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "bottom", "start", "end"] as const).map((placement) => (
        <TooltipTrigger key={placement} delay={300}>
          <Button variant="secondary">{placement}</Button>
          <Tooltip placement={placement}>Placed {placement}</Tooltip>
        </TooltipTrigger>
      ))}
    </div>
  );
}
