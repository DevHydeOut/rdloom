import { Card } from "@rdloom/react";

export default function CardBasicExample() {
  return (
    <div className="w-80 max-w-full">
      <Card title="Team plan" description="Up to 10 members">
        <p>Shared projects, version history and priority support.</p>
      </Card>
    </div>
  );
}
