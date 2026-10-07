import { AuthCard, ErrorSummary, Form, FormCheckbox, FormSubmitButton, FormTextField } from "@rdloom/react";

const link = "rounded-[var(--rd-radius-control)] font-medium text-[var(--rd-color-text-default)] underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";

// Two columns on a wide screen: the illustration is decorative and disappears on a phone.
export default function AuthCardSignUpExample() {
  return (
    <div className="h-full w-full">
      <AuthCard
        brand={<span className="text-lg font-semibold tracking-tight text-[var(--rd-color-text-default)]">rdloom</span>}
        title="Create your account"
        description="Free for 14 days. No card needed."
        illustration={
          <div className="flex max-w-xs flex-col gap-3">
            <p className="text-xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Everything your team needs in one place.</p>
            <p className="text-sm text-[var(--rd-color-text-muted)]">Invoices, customers and reports that stay in step.</p>
          </div>
        }
        footer={
          <p>
            Already have an account?{" "}
            <a href="/sign-in" className={link}>
              Sign in
            </a>
          </p>
        }
      >
        <Form className="flex flex-col gap-4" defaultValues={{ name: "", email: "", password: "", terms: false }} onSubmit={() => {}}>
          <ErrorSummary title="Check these details" />
          <FormTextField name="name" label="Full name" autoComplete="name" isRequired />
          <FormTextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            isRequired
            validate={(v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter an email address like name@company.com." : null)}
          />
          <FormTextField
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            description="At least 8 characters."
            isRequired
            validate={(v) => (v && v.length < 8 ? "Use at least 8 characters." : null)}
          />
          <FormCheckbox name="terms" isRequired requiredMessage="Accept the terms to create an account.">
            I agree to the terms of service
          </FormCheckbox>
          <FormSubmitButton className="w-full">Create account</FormSubmitButton>
        </Form>
      </AuthCard>
    </div>
  );
}
