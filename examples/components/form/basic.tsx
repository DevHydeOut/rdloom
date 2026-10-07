import { Form, FormCheckbox, FormSubmitButton, FormTextField } from "@rdloom/react";

export default function FormBasicExample() {
  return (
    <Form
      className="w-80"
      defaultValues={{ email: "", password: "", remember: false }}
      onSubmit={(values) => {
        // Send the values to your own sign-in call here.
        console.log(values);
      }}
    >
      <FormTextField name="email" label="Email" type="email" autoComplete="email" isRequired />
      <FormTextField name="password" label="Password" type="password" autoComplete="current-password" isRequired />
      <FormCheckbox name="remember">Keep me signed in</FormCheckbox>
      <FormSubmitButton>Sign in</FormSubmitButton>
    </Form>
  );
}
