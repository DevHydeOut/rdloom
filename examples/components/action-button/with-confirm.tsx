import { ActionButton } from "@rdloom/react";

export default function ActionButtonWithConfirmExample() {
  return (
    <ActionButton
      variant="danger"
      confirm={{
        title: "Delete this user?",
        description: "Asha Menon will lose access immediately. This cannot be undone.",
        confirmLabel: "Delete user",
      }}
      onAction={async () => {
        // Remove the user here.
      }}
      successMessage="User deleted"
      errorMessage="Could not delete the user"
    >
      Delete user
    </ActionButton>
  );
}
