import { Step, Steps } from "@rdloom/react";

export default function StepsWithDescriptionsExample() {
  return (
    <Steps label="Onboarding" orientation="vertical" currentStep={2}>
      <Step title="Profile" description="Your name and photo" />
      <Step title="Workspace" description="Name it and pick a plan" />
      <Step title="Invite" description="Add the people you work with" />
    </Steps>
  );
}
