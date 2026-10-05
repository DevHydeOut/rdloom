import { Badge } from "@rdloom/react";

export default function BadgeSizesExample() {
  return (
    <div className="flex items-center gap-2">
      <Badge size="sm" variant="info">
        Beta
      </Badge>
      <Badge size="md" variant="info">
        Beta
      </Badge>
    </div>
  );
}
