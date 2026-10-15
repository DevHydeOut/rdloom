import { Button, toast } from "@rdloom/react";

export default function ToastAnimatedExample() {
  return (
    <div className="flex w-full justify-center">
      <Button onPress={() => toast({ title: "Report exported", description: "It slides in from the edge.", variant: "success", animated: true })}>
        Export report
      </Button>
    </div>
  );
}
