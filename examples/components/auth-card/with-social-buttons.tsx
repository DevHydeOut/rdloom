import { AuthCard, Button, ErrorSummary, Form, FormSubmitButton, FormTextField, GlobeIcon, UsersIcon } from "@rdloom/react";

const link = "inline-block min-h-6 rounded-[var(--rd-radius-control)] font-medium text-[var(--rd-color-text-default)] underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";

// socialProviders puts the buttons under the form, after a divider. socialLabel is the word on the divider.
export default function AuthCardWithSocialButtonsExample() {
  return (
    <div className="h-full w-full">
      <AuthCard
        brand={<span className="text-lg font-semibold tracking-tight text-[var(--rd-color-text-default)]">rdloom</span>}
        title="Create your account"
        description="Pick the way you want to sign up."
        socialLabel="or"
        socialProviders={
          <>
            <Button variant="secondary" className="w-full">
              <GlobeIcon aria-hidden="true" />
              Continue with a provider
            </Button>
            <Button variant="secondary" className="w-full">
              <UsersIcon aria-hidden="true" />
              Single sign-on
            </Button>
          </>
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
        <Form className="flex flex-col gap-4" defaultValues={{ email: "", password: "" }} onSubmit={() => {}}>
          <ErrorSummary title="Check these details" />
          <FormTextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            isRequired
            validate={(v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter an email address like name@company.com." : null)}
          />
          <FormTextField name="password" label="Password" type="password" autoComplete="new-password" isRequired />
          <FormSubmitButton className="w-full">Create account</FormSubmitButton>
        </Form>
      </AuthCard>
    </div>
  );
}
