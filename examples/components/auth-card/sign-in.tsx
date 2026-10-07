import { AuthCard, Button, ErrorSummary, Form, FormSubmitButton, FormTextField } from "@rdloom/react";

const link = "rounded-[var(--rd-radius-control)] font-medium text-[var(--rd-color-text-default)] underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";

// A failed sign in reports one message for the whole form in the ErrorSummary, without saying which of the two was wrong.
export default function AuthCardSignInExample() {
  return (
    <div className="h-full w-full">
      <AuthCard
        brand={<span className="text-lg font-semibold tracking-tight text-[var(--rd-color-text-default)]">rdloom</span>}
        title="Sign in to your account"
        description="Welcome back. Enter your details to continue."
        socialProviders={
          <Button variant="secondary" className="w-full">
            Continue with single sign-on
          </Button>
        }
        footer={
          <>
            <a href="/forgot-password" className={link}>
              Forgot your password?
            </a>
            <p>
              New here?{" "}
              <a href="/sign-up" className={link}>
                Create an account
              </a>
            </p>
          </>
        }
      >
        <Form
          className="flex flex-col gap-4"
          defaultValues={{ email: "", password: "" }}
          onSubmit={async (values) => {
            await new Promise((resolve) => setTimeout(resolve, 600));
            return values.password === "wrong" ? { formError: "The email or password is not right. Check them and try again." } : undefined;
          }}
        >
          <ErrorSummary title="We could not sign you in" />
          <FormTextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            isRequired
            validate={(v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter an email address like name@company.com." : null)}
          />
          <FormTextField name="password" label="Password" type="password" autoComplete="current-password" isRequired />
          <FormSubmitButton className="w-full">Sign in</FormSubmitButton>
        </Form>
      </AuthCard>
    </div>
  );
}
