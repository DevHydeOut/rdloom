import { Form, FormSubmitButton, FormSwitch, FormTextField, useFormValues } from "@rdloom/react";

type Values = { name: string; invoiceByPost: boolean; address: string };

// A field that exists only while a choice is on: it is checked only while it is shown.
function Address() {
  const byPost = useFormValues<Values, boolean>((v) => v.invoiceByPost);
  return byPost ? <FormTextField name="address" label="Postal address" multiline isRequired /> : null;
}

export default function FormConditionalFieldExample() {
  return (
    <Form<Values> className="w-96" defaultValues={{ name: "", invoiceByPost: false, address: "" }} onSubmit={() => {}}>
      <FormTextField name="name" label="Company name" isRequired />
      <FormSwitch name="invoiceByPost">Send invoices by post</FormSwitch>
      <Address />
      <FormSubmitButton>Save</FormSubmitButton>
    </Form>
  );
}
