import { Step, Steps } from "@rdloom/react";

export default function StepsHorizontalExample() {
  return (
    <div className="w-[34rem] max-w-full">
      <Steps label="Checkout progress" currentStep={2}>
        <Step title="Cart" />
        <Step title="Payment" />
        <Step title="Review" />
        <Step title="Done" />
      </Steps>
    </div>
  );
}
