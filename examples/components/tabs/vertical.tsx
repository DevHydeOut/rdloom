import { Tab, TabList, TabPanel, Tabs } from "@rdloom/react";

export default function TabsVerticalExample() {
  return (
    <Tabs orientation="vertical" className="w-full max-w-lg">
      <TabList aria-label="Project">
        <Tab id="overview">Overview</Tab>
        <Tab id="activity">Activity</Tab>
        <Tab id="settings">Settings</Tab>
      </TabList>
      <TabPanel id="overview">Project summary and key numbers.</TabPanel>
      <TabPanel id="activity">Recent changes by the team.</TabPanel>
      <TabPanel id="settings">Name, members and permissions.</TabPanel>
    </Tabs>
  );
}
