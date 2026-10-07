import { AppHeader, BreadcrumbItem, Breadcrumbs, Button, SidebarIcon, UserMenu } from "@rdloom/react";

// The breadcrumbs take the free space and shorten first. leading holds the button that folds the sidebar.
export default function AppHeaderWithBreadcrumbsExample() {
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <AppHeader
        leading={
          <Button variant="ghost" size="sm" aria-label="Fold the sidebar">
            <SidebarIcon />
          </Button>
        }
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/customers">Customers</BreadcrumbItem>
            <BreadcrumbItem>Brightwater Supplies</BreadcrumbItem>
          </Breadcrumbs>
        }
        onSearch={() => {}}
        actions={<Button size="sm">New customer</Button>}
        userMenu={<UserMenu user={{ name: "Ada Lovelace", email: "ada@example.com" }} onSignOut={async () => {}} />}
      />
      <div className="h-24" />
    </div>
  );
}
