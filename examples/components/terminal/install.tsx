import { Terminal } from "@rdloom/react";

export default function TerminalInstallExample() {
  return (
    <div className="flex w-full justify-center">
      <Terminal
        className="w-full max-w-2xl"
        label="Install steps"
        prompt=">"
        speed={25}
        copyLabel="Copy commands"
        lines={[{ text: "npm install @rdloom/react" }, { text: "npx rdloom add dialog" }]}
      />
    </div>
  );
}
