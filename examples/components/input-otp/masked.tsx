import { InputOTP } from "@rdloom/react";

export default function InputOTPMaskedExample() {
  return <InputOTP label="Security PIN" length={4} mask description="Your 4 digit PIN is hidden as you type." />;
}
