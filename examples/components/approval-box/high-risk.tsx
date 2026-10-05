import { ApprovalBox } from "@rdloom/react";

// High risk uses the danger style, says so in words, and is announced assertively.
export default function ApprovalBoxHighRiskExample() {
  return (
    <div className="w-[30rem] max-w-full">
      <ApprovalBox summary="Delete 12 draft invoices" risk="high" reversible={false} approveLabel="Delete invoices" denyLabel="Keep them">
        <ul className="list-disc ps-5">
          <li>INV-1041 to INV-1052</li>
          <li>Created between March 3 and March 19</li>
        </ul>
      </ApprovalBox>
    </div>
  );
}
