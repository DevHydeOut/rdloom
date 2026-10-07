import { ActionButton } from "@rdloom/react";

export default function ActionButtonBasicExample() {
  return (
    <ActionButton
      onAction={async () => {
        // Call your API here.
      }}
      successMessage="Invoice sent"
    >
      Send invoice
    </ActionButton>
  );
}
