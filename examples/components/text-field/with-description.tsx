import { TextField } from "@rdloom/react";

export default function TextFieldWithDescriptionExample() {
  return (
    <TextField className="w-64" label="Email" type="email" placeholder="you@company.com" description="We only use it for sign-in." />
  );
}
