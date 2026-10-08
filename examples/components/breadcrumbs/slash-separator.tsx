import { BreadcrumbItem, Breadcrumbs } from "@rdloom/react";

export default function BreadcrumbsSlashSeparatorExample() {
  return (
    <div className="flex w-full justify-center">
      <Breadcrumbs separator="slash">
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/settings">Settings</BreadcrumbItem>
        <BreadcrumbItem>Billing</BreadcrumbItem>
      </Breadcrumbs>
    </div>
  );
}
