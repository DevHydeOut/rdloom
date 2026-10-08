import { BreadcrumbItem, Breadcrumbs, HomeIcon } from "@rdloom/react";

// An icon before the first step. The text still names it, so the icon is decorative.
export default function BreadcrumbsWithIconExample() {
  return (
    <div className="flex w-full justify-center">
      <Breadcrumbs>
        <BreadcrumbItem href="/" icon={<HomeIcon />}>
          Home
        </BreadcrumbItem>
        <BreadcrumbItem href="/invoices">Invoices</BreadcrumbItem>
        <BreadcrumbItem>INV-2041</BreadcrumbItem>
      </Breadcrumbs>
    </div>
  );
}
