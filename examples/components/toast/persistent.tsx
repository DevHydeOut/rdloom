import { Button, toast } from "@rdloom/react";

export default function ToastPersistentExample() {
  return (
    <Button
      variant="secondary"
      // timeout 0 keeps it until the user closes it.
      onPress={() => toast({ title: "New version available", description: "Reload to update.", timeout: 0 })}
    >
      Check for updates
    </Button>
  );
}
