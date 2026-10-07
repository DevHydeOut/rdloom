import { ActionButton } from "@rdloom/react";

export default function ActionButtonTypeToConfirmExample() {
  return (
    <ActionButton
      variant="danger"
      confirm={{
        title: "Delete this project?",
        description: "Every file and member in Northwind will be removed.",
        confirmLabel: "Delete project",
        confirmText: "Northwind",
      }}
      onAction={async () => {
        // Remove the project here.
      }}
    >
      Delete project
    </ActionButton>
  );
}
