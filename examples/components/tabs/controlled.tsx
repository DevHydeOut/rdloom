import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "@rdloom/react";

export default function TabsControlledExample() {
  const [tab, setTab] = useState("week");
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(key as string)}>
        <TabList aria-label="Range">
          <Tab id="day">Day</Tab>
          <Tab id="week">Week</Tab>
          <Tab id="month">Month</Tab>
        </TabList>
        <TabPanel id="day">Today's numbers.</TabPanel>
        <TabPanel id="week">This week's numbers.</TabPanel>
        <TabPanel id="month">This month's numbers.</TabPanel>
      </Tabs>
      <p className="text-sm">Showing: {tab}</p>
    </div>
  );
}
