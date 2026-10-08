import { AuthCard, ChartIcon, ErrorSummary, Form, FormSubmitButton, FormTextField, SparkleIcon, UsersIcon } from "@rdloom/react";

const points = [
  { icon: <ChartIcon />, text: "A shared view of every project" },
  { icon: <UsersIcon />, text: "Roles for owners, editors and guests" },
  { icon: <SparkleIcon />, text: "Updates that arrive without chasing" },
];

// A layered panel of gradients and shapes. It carries no information, so AuthCard hides it from assistive technology and from narrow screens.
function Panel() {
  return (
    <div className="relative flex h-full min-h-[30rem] w-full items-end overflow-hidden bg-[radial-gradient(circle_at_20%_10%,var(--rd-color-surface-default),transparent_55%),linear-gradient(160deg,var(--rd-color-border-default),var(--rd-color-surface-subtle))] p-10">
      <div className="absolute start-10 top-12 flex h-24 w-48 flex-col justify-center gap-2 rounded-2xl bg-[var(--rd-color-surface-default)] px-4 opacity-90 [box-shadow:var(--rd-elevation-raised)]">
        <span className="h-2 w-24 rounded-full bg-[var(--rd-color-border-default)]" />
        <span className="h-2 w-36 rounded-full bg-[var(--rd-color-border-default)]" />
        <span className="h-2 w-16 rounded-full bg-[var(--rd-color-text-muted)] opacity-50" />
      </div>
      <div className="absolute end-8 top-40 size-28 rounded-full border-[18px] border-[var(--rd-color-surface-default)] opacity-70" />
      <div className="absolute end-24 top-16 size-10 rotate-12 rounded-xl bg-[var(--rd-color-text-default)] opacity-10" />
      <ul className="relative flex flex-col gap-3">
        {points.map((point) => (
          <li key={point.text} className="flex items-center gap-3 text-sm font-medium text-[var(--rd-color-text-default)]">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--rd-color-surface-default)] [box-shadow:var(--rd-elevation-raised)]">{point.icon}</span>
            {point.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

// The form on one side and the illustration on the other. The panel is a prop, so it can be any decoration you design.
export default function AuthCardSplitWithImageExample() {
  return (
    <div className="h-full w-full">
      <AuthCard
        brand={<span className="text-lg font-semibold tracking-tight text-[var(--rd-color-text-default)]">rdloom</span>}
        title="Join your team"
        description="Use the email your invitation was sent to."
        illustration={<Panel />}
        classNames={{ illustration: "!p-0 !items-stretch" }}
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
          <FormTextField name="password" label="Choose a password" type="password" autoComplete="new-password" description="At least 8 characters." isRequired validate={(v) => (v && v.length < 8 ? "Use at least 8 characters." : null)} />
          <FormSubmitButton className="w-full">Join team</FormSubmitButton>
        </Form>
      </AuthCard>
    </div>
  );
}
