import { Sparkline } from "@rdloom/react";

export default function SparklineLineExample() {
  return <Sparkline data={[21, 24, 22, 30, 28, 35, 41, 38, 44, 48]} label="Revenue, last 10 weeks: from 21K to 48K" />;
}
