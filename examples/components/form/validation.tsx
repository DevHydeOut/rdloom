import { ErrorSummary, Form, FormSelect, FormSubmitButton, FormTextField, SelectItem } from "@rdloom/react";

const looksLikeEmail = (value: string) => (/^\S+@\S+\.\S+$/.test(value) ? null : "Enter an email address like name@example.com.");

export default function FormValidationExample() {
  return (
    <Form className="w-96" defaultValues={{ name: "", email: "", role: null }} onSubmit={() => {}}>
      {/* After a failed submit focus moves here; each item takes you to its field. */}
      <ErrorSummary />
      <FormTextField name="name" label="Full name" isRequired requiredMessage="Enter the person's full name." />
      <FormTextField
        name="email"
        label="Email"
        type="email"
        description="We send the invitation here."
        isRequired
        validate={looksLikeEmail}
      />
      <FormSelect name="role" label="Role" placeholder="Choose a role" isRequired>
        <SelectItem id="admin">Admin</SelectItem>
        <SelectItem id="editor">Editor</SelectItem>
        <SelectItem id="viewer">Viewer</SelectItem>
      </FormSelect>
      <FormSubmitButton>Send invitation</FormSubmitButton>
    </Form>
  );
}
