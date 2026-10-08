import { useState } from "react";
import { AuthCard, ErrorSummary, Form, FormSubmitButton, FormTextField } from "@rdloom/react";

// A guide only: the server decides what is accepted.
function strength(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value) && value.length >= 10) score++;
  return score;
}

const words = ["Too weak", "Weak", "Fair", "Good", "Strong"];

// The hint reads the password input as it is typed in. It is announced politely through its status region.
export default function AuthCardResetPasswordExample() {
  const [password, setPassword] = useState("");
  const score = strength(password);
  return (
    <div className="h-full w-full">
      <AuthCard
        brand={<span className="text-lg font-semibold tracking-tight text-[var(--rd-color-text-default)]">rdloom</span>}
        title="Choose a new password"
        description="Use something you have not used on another site."
      >
        <Form className="flex flex-col gap-4" defaultValues={{ password: "", confirm: "" }} onSubmit={() => {}}>
          <ErrorSummary title="Check these details" />
          <div className="flex flex-col gap-3" onInput={(event) => event.target instanceof HTMLInputElement && event.target.type === "password" && event.target.autocomplete === "new-password" && event.target.name === "password" && setPassword(event.target.value)}>
            <FormTextField
              name="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              isRequired
              validate={(v) => (v && v.length < 8 ? "Use at least 8 characters." : null)}
            />
            <div className="flex flex-col gap-1.5">
              <div aria-hidden="true" className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <span key={n} className={`h-1.5 rounded-full transition-colors motion-reduce:transition-none ${n <= score ? "bg-[var(--rd-color-text-default)]" : "bg-[var(--rd-color-border-default)]"}`} />
                ))}
              </div>
              <p role="status" className="text-xs text-[var(--rd-color-text-muted)]">
                {password ? `Strength: ${words[score]}` : "Use 8 or more characters with a mix of letters, numbers and symbols."}
              </p>
            </div>
          </div>
          <FormTextField
            name="confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            isRequired
            validate={(v) => (v && v !== password ? "The passwords do not match." : null)}
          />
          <FormSubmitButton className="w-full">Reset password</FormSubmitButton>
        </Form>
      </AuthCard>
    </div>
  );
}
