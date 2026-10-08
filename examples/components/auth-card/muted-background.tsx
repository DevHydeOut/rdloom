import { AuthCard, ErrorSummary, Form, FormSubmitButton, FormTextField } from "@rdloom/react";

const link = "inline-block min-h-6 rounded-[var(--rd-radius-control)] font-medium text-[var(--rd-color-text-default)] underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";

// The card sits on a muted page that fills the whole height. On a real page pass min-h-dvh in className.
export default function AuthCardMutedBackgroundExample() {
  return (
    <div className="h-full w-full">
      <AuthCard
        className="bg-[var(--rd-color-border-default)]"
        brand={<span className="text-lg font-semibold tracking-tight text-[var(--rd-color-text-default)]">rdloom</span>}
        title="Welcome back"
        description="Sign in to see what changed while you were away."
        footer={
          <p>
            No account yet?{" "}
            <a href="/sign-up" className={link}>
              Create one
            </a>
          </p>
        }
      >
        <Form className="flex flex-col gap-4" defaultValues={{ email: "", password: "" }} onSubmit={() => {}}>
          <ErrorSummary title="We could not sign you in" />
          <FormTextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
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
