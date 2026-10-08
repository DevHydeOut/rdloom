import { BreadcrumbItem, Breadcrumbs } from "@rdloom/react";

const dot = <span className="size-1 rounded-full bg-current" />;

// Any mark can go between steps. Give each item the same `separator` to keep the trail even.
export default function BreadcrumbsCustomSeparatorExample() {
  return (
    <div className="flex w-full justify-center">
      <Breadcrumbs>
        <BreadcrumbItem href="/" separator={dot}>
          Home
        </BreadcrumbItem>
        <BreadcrumbItem href="/reports" separator={dot}>
          Reports
        </BreadcrumbItem>
        <BreadcrumbItem>Quarterly sales</BreadcrumbItem>
      </Breadcrumbs>
    </div>
  );
}
