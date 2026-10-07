import { useState } from "react";
import { AuthCard, ErrorSummary, Form, FormSubmitButton, FormTextField } from "@rdloom/react";

const link = "rounded-[var(--rd-radius-control)] font-medium text-[var(--rd-color-text-default)] underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";

export default function AuthCardForgotPasswordExample() {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="h-full w-full">
      <AuthCard
        brand={<span className="text-lg font-semibold tracking-tight text-[var(--rd-color-text-default)]">rdloom</span>}
        title={sent ? "Check your email" : "Reset your password"}
        description={sent ? `If an account exists for ${sent}, a reset link is on its way.` : "Enter your email and we will send you a link to choose a new password."}
        footer={
          <a href="/sign-in" className={link}>
            Back to sign in
          </a>
        }
      >
        {!sent && (
          <Form
            className="flex flex-col gap-4"
            defaultValues={{ email: "" }}
            onSubmit={async (values) => {
              await new Promise((resolve) => setTimeout(resolve, 600));
              setSent(values.email);
            }}
          >
            <ErrorSummary title="Check your email address" />
            <FormTextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            isRequired
            validate={(v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter an email address like name@company.com." : null)}
          />
            <FormSubmitButton className="w-full">Send reset link</FormSubmitButton>
          </Form>
        )}
      </AuthCard>
    </div>
  );
}
