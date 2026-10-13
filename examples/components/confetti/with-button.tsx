import { useRef } from "react";
import { Button, Confetti, type ConfettiHandle } from "@rdloom/react";

export default function ConfettiWithButtonExample() {
  const confetti = useRef<ConfettiHandle>(null);
  return (
    <div className="flex w-full justify-center">
      <Confetti ref={confetti} />
      <Button onPress={() => confetti.current?.fire({ origin: { x: 0.5, y: 0.7 } })}>Celebrate</Button>
    </div>
  );
}
