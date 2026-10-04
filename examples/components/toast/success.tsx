import { Button, toast } from "@rdloom/react";

export default function ToastSuccessExample() {
  return (
    <Button onPress={() => toast({ title: "Changes saved", variant: "success" })}>Save</Button>
  );
}
