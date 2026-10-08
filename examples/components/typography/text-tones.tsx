import { Lead, Text } from "@rdloom/react";

export default function TypographyTextTonesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-md flex-col gap-2">
        <Lead>A short introduction to the page.</Lead>
        <Text size="lg">Large default text</Text>
        <Text>Medium default text</Text>
        <Text size="sm" tone="muted">
          Small muted helper text
        </Text>
        <Text size="sm" tone="danger">
          The password must have at least 8 characters.
        </Text>
        <Text>
          Inline{" "}
          <Text as="span" tone="muted">
            muted span
          </Text>{" "}
          inside a paragraph.
        </Text>
      </div>
    </div>
  );
}
