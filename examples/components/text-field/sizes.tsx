import { TextField } from "@rdloom/react";

export default function TextFieldSizesExample() {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <TextField className="w-40" label="Small" size="sm" />
      <TextField className="w-40" label="Medium" size="md" />
      <TextField className="w-40" label="Large" size="lg" />
    </div>
  );
}
