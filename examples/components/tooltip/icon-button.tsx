import { Button, Tooltip, TooltipTrigger } from "@rdloom/react";

export default function TooltipIconButtonExample() {
  return (
    <TooltipTrigger delay={300}>
      <Button variant="ghost" aria-label="Settings">
        ⚙
      </Button>
      <Tooltip>Settings</Tooltip>
    </TooltipTrigger>
  );
}
