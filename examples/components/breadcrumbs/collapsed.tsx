import { BreadcrumbEllipsis, BreadcrumbItem, Breadcrumbs } from "@rdloom/react";

// The middle of a long trail sits behind one button. Its steps open as a menu of links.
export default function BreadcrumbsCollapsedExample() {
  return (
    <div className="flex w-full justify-center">
      <Breadcrumbs label="You are here">
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbEllipsis
          items={[
            { label: "Documentation", href: "/docs" },
            { label: "Components", href: "/docs/components" },
            { label: "Forms", href: "/docs/components/forms" },
          ]}
        />
        <BreadcrumbItem href="/docs/components/forms/inputs">Inputs</BreadcrumbItem>
        <BreadcrumbItem>Number field</BreadcrumbItem>
      </Breadcrumbs>
    </div>
  );
}
