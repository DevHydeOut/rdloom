import { Card } from "@rdloom/react";

export default function CardVariantsExample() {
  return (
    <div className="grid w-[40rem] max-w-full gap-4 sm:grid-cols-3">
      <Card title="Outlined" variant="outlined">
        A border, no shadow.
      </Card>
      <Card title="Raised" variant="raised">
        A border and a shadow.
      </Card>
      <Card title="Subtle" variant="subtle">
        A tinted block.
      </Card>
    </div>
  );
}
