import { useState } from "react";
import { Select, SelectItem } from "@rdloom/react";

export default function SelectControlledExample() {
  const [role, setRole] = useState("editor");
  return (
    <div className="flex flex-col gap-2">
      <Select className="w-64" label="Role" selectedKey={role} onSelectionChange={(key) => setRole(key as string)}>
        <SelectItem id="admin">Admin</SelectItem>
        <SelectItem id="editor">Editor</SelectItem>
        <SelectItem id="viewer">Viewer</SelectItem>
      </Select>
      <p className="text-sm">Selected: {role}</p>
    </div>
  );
}
