import { AuthCard, Form, FormSubmitButton, FormTextField } from "@rdloom/react";

// No card border, shadow or tint: the logo, a heading and a short form on the plain page. classNames reaches the root and the card.
export default function AuthCardCenteredMinimalExample() {
  return (
    <div className="h-full w-full">
      <AuthCard
        size="sm"
        brand={<span className="text-xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">rdloom</span>}
        title="Sign in"
        classNames={{
          root: "bg-[var(--rd-color-surface-default)]",
          card: "rounded-none border-0 bg-transparent [box-shadow:none]",
        }}
      >
        <Form className="flex flex-col gap-4" defaultValues={{ email: "" }} onSubmit={() => {}}>
          <FormTextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            isRequired
            validate={(v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter an email address like name@company.com." : null)}
          />
          <FormSubmitButton className="w-full">Email me a sign-in link</FormSubmitButton>
        </Form>
      </AuthCard>
    </div>
  );
}
