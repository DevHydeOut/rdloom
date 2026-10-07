import { Alert, ErrorSummary, Form, FormSubmitButton, FormTextField } from "@rdloom/react";

// Stands in for your own request; it fails for one address so the error state shows.
async function saveProfile(values: { name: string; email: string }) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (values.email === "taken@example.com") {
    return { fieldErrors: { email: "That email is already in use." } };
  }
}

export default function FormAsyncSubmitExample() {
  return (
    <Form
      className="w-96"
      defaultValues={{ name: "Ada Lovelace", email: "ada@example.com" }}
      onSubmit={saveProfile}
      successMessage="Profile saved."
    >
      {({ state }) => (
        <>
          <ErrorSummary />
          {state === "success" && <Alert variant="success">Profile saved.</Alert>}
          <FormTextField name="name" label="Full name" isRequired />
          <FormTextField name="email" label="Email" type="email" isRequired description="Try taken@example.com to see the error state." />
          <FormSubmitButton>{state === "pending" ? "Saving" : "Save profile"}</FormSubmitButton>
        </>
      )}
    </Form>
  );
}
