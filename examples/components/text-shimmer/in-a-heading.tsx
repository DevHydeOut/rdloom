import { TextShimmer } from "@rdloom/react";

export default function TextShimmerInAHeadingExample() {
  return (
    <h3 className="text-2xl font-semibold">
      Your report is{" "}
      <TextShimmer baseColor="var(--rd-color-action-primary)" highlightColor="var(--rd-color-text-default)" duration={2.2}>
        being prepared
      </TextShimmer>
    </h3>
  );
}
