import { Button, ButtonGroup } from "@rdloom/react";

const icon = { "aria-hidden": true, viewBox: "0 0 16 16", width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export default function ButtonGroupIconToolbarExample() {
  return (
    <div className="flex w-full justify-center">
      <ButtonGroup label="Text alignment" size="sm">
        <Button variant="secondary" aria-label="Align left" className="aspect-square px-0!">
          <svg {...icon}><path d="M2 4h12M2 8h8M2 12h10" /></svg>
        </Button>
        <Button variant="secondary" aria-label="Align center" className="aspect-square px-0!">
          <svg {...icon}><path d="M2 4h12M4 8h8M3 12h10" /></svg>
        </Button>
        <Button variant="secondary" aria-label="Align right" className="aspect-square px-0!">
          <svg {...icon}><path d="M2 4h12M6 8h8M4 12h10" /></svg>
        </Button>
      </ButtonGroup>
    </div>
  );
}
