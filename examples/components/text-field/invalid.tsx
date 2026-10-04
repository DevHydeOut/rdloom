import { Button, TextField } from "@rdloom/react";

export default function TextFieldInvalidExample() {
  return (
    <form className="flex flex-col items-start gap-3" onSubmit={(e) => e.preventDefault()}>
      {/* Declare the rules; errors show on submit and are announced. */}
      <TextField
        className="w-64"
        label="Username"
        isRequired
        validate={(v) => (v.length > 0 && v.length < 3 ? "Use at least 3 characters." : null)}
      />
      <Button type="submit">Create account</Button>
    </form>
  );
}
