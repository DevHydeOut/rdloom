import { Terminal } from "@rdloom/react";

export default function TerminalBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <Terminal
        className="w-full max-w-md"
        lines={[
          { text: "npx rdloom init" },
          { text: "Created rdloom.json", kind: "output" },
          { text: "npx rdloom add button" },
          { text: "Added button to src/components/ui", kind: "output" },
        ]}
      />
    </div>
  );
}
