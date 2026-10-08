import { AuthCard, ChartIcon, ErrorSummary, Form, FormCheckbox, FormSubmitButton, FormTextField, SparkleIcon, UsersIcon } from "@rdloom/react";

const link = "rounded-[var(--rd-radius-control)] font-medium text-[var(--rd-color-text-default)] underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";

const points = [
  { icon: <ChartIcon />, text: "Reports that stay in step with your data" },
  { icon: <UsersIcon />, text: "Invite your team and share a single view" },
  { icon: <SparkleIcon />, text: "Set up in minutes, with nothing to install" },
];

// Built from gradients and shapes, with no image file. AuthCard already hides the panel from assistive technology.
function Panel() {
  return (
    <div className="relative flex h-full min-h-[34rem] w-full flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,var(--rd-color-surface-subtle),var(--rd-color-border-default))] p-10">
      <div className="absolute -end-16 -top-16 size-64 rounded-full bg-[var(--rd-color-surface-default)] opacity-60" />
      <div className="absolute -bottom-20 -start-12 size-72 rounded-full border-[28px] border-[var(--rd-color-surface-default)] opacity-50" />
      <div className="absolute end-10 bottom-32 size-16 rotate-12 rounded-2xl bg-[var(--rd-color-surface-default)] opacity-70 [box-shadow:var(--rd-elevation-raised)]" />
      <div className="relative flex flex-col gap-5">
        <p className="text-2xl font-semibold tracking-[-0.02em] text-[var(--rd-color-text-default)]">Everything your team needs in one place.</p>
        <ul className="flex flex-col gap-4">
          {points.map((point) => (
            <li key={point.text} className="flex items-center gap-3 text-sm text-[var(--rd-color-text-default)]">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] bg-[var(--rd-color-surface-default)] [box-shadow:var(--rd-elevation-raised)]">{point.icon}</span>
              {point.text}
            </li>
          ))}
        </ul>
      </div>
      <figure className="relative flex flex-col gap-2 rounded-2xl bg-[var(--rd-color-surface-default)] p-4 text-sm [box-shadow:var(--rd-elevation-raised)]">
        <blockquote className="text-[var(--rd-color-text-default)]">We moved our whole month-end into it in an afternoon.</blockquote>
        <figcaption className="text-[var(--rd-color-text-muted)]">Priya N., finance lead at Orbit Systems</figcaption>
      </figure>
    </div>
  );
}

// Two columns on a wide screen: the illustration is decorative and disappears on a phone.
export default function AuthCardSignUpExample() {
  return (
    <div className="h-full w-full">
      <AuthCard
        brand={<span className="text-lg font-semibold tracking-tight text-[var(--rd-color-text-default)]">rdloom</span>}
        title="Create your account"
        description="Free for 14 days. No card needed."
        illustration={<Panel />}
        classNames={{ illustration: "!p-0 !items-stretch" }}
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
