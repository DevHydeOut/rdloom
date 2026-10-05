import { Step, Steps } from "@rdloom/react";

export default function StepsVerticalExample() {
  return (
    <Steps label="Setup" orientation="vertical" currentStep={3}>
      <Step title="Create your account" />
      <Step title="Verify your email" />
      <Step title="Connect a data source" />
      <Step title="Invite your team" />
    </Steps>
  );
}
