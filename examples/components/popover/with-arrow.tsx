import { Button, Popover, PopoverTrigger } from "@rdloom/react";

export default function PopoverWithArrowExample() {
  return (
    <PopoverTrigger>
      <Button variant="secondary">What's new</Button>
      <Popover label="What's new" showArrow>
        <p className="w-60 text-sm">Data grids now support inline editing and pagination.</p>
      </Popover>
    </PopoverTrigger>
  );
}
