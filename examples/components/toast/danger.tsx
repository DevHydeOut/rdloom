import { Button, toast } from "@rdloom/react";

export default function ToastDangerExample() {
  return (
    <Button
      variant="secondary"
      onPress={() => toast({ title: "Upload failed", description: "Check your connection and try again.", variant: "danger" })}
    >
      Upload
    </Button>
  );
}
