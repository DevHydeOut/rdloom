import { TextAnimate } from "@rdloom/react";

// Keep character animation to a few words: the total time grows with every letter.
export default function TextAnimateByCharacterExample() {
  return (
    <div className="flex w-full justify-center">
      <TextAnimate by="character" animation="slideUp" stagger={0.04} className="text-3xl font-bold">
        Hello there
      </TextAnimate>
    </div>
  );
}
