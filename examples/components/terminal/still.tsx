import { Terminal } from "@rdloom/react";

export default function TerminalStillExample() {
  return (
    <div className="flex w-full justify-center">
      <Terminal
        isPaused
        className="w-full max-w-md"
        label="Build output"
        lines={[
          { text: "npm run build" },
          { text: "Built 42 pages in 6.1s", kind: "output" },
          { text: "No problems found", kind: "output" },
        ]}
      />
    </div>
  );
}
