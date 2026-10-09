import { WordRotate } from "@rdloom/react";

// announce reads each new word out politely, for when the word is part of the message.
export default function WordRotateInAHeadingExample() {
  return (
    <div className="flex w-full justify-center">
      <h3 className="text-xl font-semibold">
        Your data, <WordRotate announce duration={3000} words={["secure", "portable", "yours"]} />
      </h3>
    </div>
  );
}
