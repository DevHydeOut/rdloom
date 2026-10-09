import { TextAnimate } from "@rdloom/react";

export default function TextAnimatePresetsExample() {
  return (
    <div className="flex w-full flex-col items-center gap-3 text-lg font-medium">
      <TextAnimate animation="fadeIn">Fade in</TextAnimate>
      <TextAnimate animation="blurIn" delay={0.2}>
        Blur in
      </TextAnimate>
      <TextAnimate animation="slideUp" delay={0.4}>
        Slide up
      </TextAnimate>
      <TextAnimate animation="scaleUp" delay={0.6}>
        Scale up
      </TextAnimate>
    </div>
  );
}
