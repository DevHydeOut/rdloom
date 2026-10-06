import { Sparkline } from "@rdloom/react";

export default function SparklineBarExample() {
  return <Sparkline type="bar" color="success" data={[3, 5, 2, 8, 6, 9, 7, 11]} label="Orders per day: from 3 to 11" />;
}
