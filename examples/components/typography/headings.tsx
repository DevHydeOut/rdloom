import { H1, H2, H3, H4, Heading } from "@rdloom/react";

export default function TypographyHeadingsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-lg flex-col gap-3">
        <H1>Heading 1</H1>
        <H2>Heading 2</H2>
        <H3>Heading 3</H3>
        <H4>Heading 4</H4>
        <Heading level={2} size="sm">
          A level 2 heading drawn small
        </Heading>
      </div>
    </div>
  );
}
