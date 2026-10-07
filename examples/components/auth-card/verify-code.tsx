import { AuthCard, Button, ErrorSummary, Field, Form, FormSubmitButton, InputOTP } from "@rdloom/react";

const link = "rounded-[var(--rd-radius-control)] font-medium text-[var(--rd-color-text-default)] underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";

// InputOTP is bound to the form with Field, so a missing or wrong code shows its message and appears in the ErrorSummary.
export default function AuthCardVerifyCodeExample() {
  return (
    <div className="h-full w-full">
      <AuthCard
        brand={<span className="text-lg font-semibold tracking-tight text-[var(--rd-color-text-default)]">rdloom</span>}
        title="Enter your code"
        description="We sent a 6 digit code to your phone. It works for 10 minutes."
        footer={
          <>
            <Button variant="ghost" size="sm">
              Send a new code
            </Button>
            <a href="/sign-in" className={link}>
              Use a different account
            </a>
          </>
        }
      >
        <Form
          className="flex flex-col gap-4"
          defaultValues={{ code: "" }}
          onSubmit={async (values) => {
            await new Promise((resolve) => setTimeout(resolve, 600));
            return values.code === "000000" ? { fieldErrors: { code: "That code is not right. Check it and try again." } } : undefined;
          }}
        >
          <ErrorSummary title="We could not check your code" />
          <Field<string> name="code" label="Verification code" validate={(v) => (v.length < 6 ? "Enter all 6 digits." : null)}>
            {({ value, setValue, onBlur, isInvalid, errorMessage }) => (
              <InputOTP label="Verification code" length={6} autoFocus value={value} onChange={setValue} onBlur={onBlur} isInvalid={isInvalid} errorMessage={errorMessage} />
            )}
          </Field>
          <FormSubmitButton className="w-full">Verify</FormSubmitButton>
        </Form>
      </AuthCard>
    </div>
  );
}
