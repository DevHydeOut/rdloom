import { BreadcrumbItem, Breadcrumbs } from "@rdloom/react";

// A long trail wraps onto the next line instead of overflowing.
export default function BreadcrumbsLongTrailExample() {
  return (
    <div className="w-72">
      <Breadcrumbs label="You are here">
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/docs">Documentation</BreadcrumbItem>
        <BreadcrumbItem href="/docs/components">Components</BreadcrumbItem>
        <BreadcrumbItem href="/docs/components/forms">Forms</BreadcrumbItem>
        <BreadcrumbItem href="/docs/components/forms/inputs">Inputs</BreadcrumbItem>
        <BreadcrumbItem>Number field</BreadcrumbItem>
      </Breadcrumbs>
    </div>
  );
}
