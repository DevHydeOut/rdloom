import { Button, Separator } from "@rdloom/react";

export default function SeparatorWithLabelExample() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Button variant="primary">Sign in with a password</Button>
      <Separator label="or" />
      <Button variant="secondary">Email me a sign-in link</Button>
    </div>
  );
}
