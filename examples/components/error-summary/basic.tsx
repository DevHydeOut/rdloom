import { ErrorSummary, Form, FormSubmitButton, FormTextField } from "@rdloom/react";

export default function ErrorSummaryBasicExample() {
  return (
    <Form className="w-96" defaultValues={{ company: "", vat: "" }} onSubmit={() => {}}>
      <ErrorSummary title="Check these details" />
      <FormTextField name="company" label="Company" isRequired />
      <FormTextField
        name="vat"
        label="VAT number"
        validate={(value) => (value && !/^[A-Z]{2}\d{8,12}$/.test(value) ? "Use two letters followed by the digits, like DE123456789." : null)}
      />
      <FormSubmitButton>Continue</FormSubmitButton>
    </Form>
  );
}
