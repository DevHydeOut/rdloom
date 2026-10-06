import { Stat } from "@rdloom/react";

export default function StatBasicExample() {
  return <Stat label="Monthly revenue" value={48200} format={(n) => `$${n.toLocaleString()}`} />;
}
