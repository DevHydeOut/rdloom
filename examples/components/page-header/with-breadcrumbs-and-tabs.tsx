import { BreadcrumbItem, Breadcrumbs, Button, PageHeader, Tab, TabList, TabPanel, Tabs } from "@rdloom/react";

// Breadcrumbs go above the title and the tabs under it. Keep the real panels for your page content; the Tabs here only need a panel each to be valid.
export default function PageHeaderWithBreadcrumbsAndTabsExample() {
  return (
    <div className="w-[56rem] max-w-full p-4">
      <PageHeader
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/customers">Customers</BreadcrumbItem>
            <BreadcrumbItem>Brightwater Supplies</BreadcrumbItem>
          </Breadcrumbs>
        }
        title="Brightwater Supplies"
        description="Customer since 2022."
        actions={<Button>Edit customer</Button>}
        tabs={
          <Tabs aria-label="Customer" defaultSelectedKey="overview">
            <TabList aria-label="Customer sections">
              <Tab id="overview">Overview</Tab>
              <Tab id="invoices">Invoices</Tab>
              <Tab id="notes">Notes</Tab>
            </TabList>
            <TabPanel id="overview" className="sr-only">Overview</TabPanel>
            <TabPanel id="invoices" className="sr-only">Invoices</TabPanel>
            <TabPanel id="notes" className="sr-only">Notes</TabPanel>
          </Tabs>
        }
        border
      />
    </div>
  );
}
