import { InputOTP } from "@rdloom/react";

export default function InputOTPAlphanumericGroupedExample() {
  return <InputOTP label="Backup code" type="alphanumeric" separatorAt={[3]} description="Letters and digits, in two groups of three." />;
}
