import { BreadcrumbItem, Breadcrumbs } from "@rdloom/react";

// The last item has no href: it is the current page.
export default function BreadcrumbsBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
        <BreadcrumbItem>Website redesign</BreadcrumbItem>
      </Breadcrumbs>
    </div>
  );
}
