import { Button, Popover, PopoverTrigger } from "@rdloom/react";

export default function PopoverPlacementsExample() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "bottom", "start", "end"] as const).map((placement) => (
        <PopoverTrigger key={placement}>
          <Button variant="secondary">{placement}</Button>
          <Popover label={`Placed ${placement}`} placement={placement} showArrow>
            <p className="text-sm">Placed {placement}</p>
          </Popover>
        </PopoverTrigger>
      ))}
    </div>
  );
}
