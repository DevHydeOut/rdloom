import { InputOTP } from "@rdloom/react";

export default function InputOTPWithErrorExample() {
  return <InputOTP label="Verification code" defaultValue="123456" isInvalid errorMessage="That code is not right. Check it and try again." />;
}
