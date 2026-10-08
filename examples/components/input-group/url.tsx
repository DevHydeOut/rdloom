import { InputGroup, InputGroupAddon, InputGroupInput } from "@rdloom/react";

export default function InputGroupUrlExample() {
  return (
    <div className="flex w-full justify-center">
      <InputGroup label="Workspace address" description="Letters, numbers and dashes only." className="w-80">
        <InputGroupAddon>https://</InputGroupAddon>
        <InputGroupInput placeholder="acme" />
        <InputGroupAddon align="end">.example.com</InputGroupAddon>
      </InputGroup>
    </div>
  );
}
