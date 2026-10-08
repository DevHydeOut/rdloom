import { Direction, Tab, TabList, TabPanel, Tabs, TextField } from "@rdloom/react";

export default function DirectionSideBySideExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="grid w-full max-w-3xl gap-8 sm:grid-cols-2">
        <Direction direction="ltr" className="flex flex-col gap-4">
          <TextField label="Name" />
          <Tabs>
            <TabList aria-label="Settings, left to right">
              <Tab id="a">Profile</Tab>
              <Tab id="b">Billing</Tab>
            </TabList>
            <TabPanel id="a">Account details.</TabPanel>
            <TabPanel id="b">Payment methods.</TabPanel>
          </Tabs>
        </Direction>
        <Direction direction="rtl" lang="ar" className="flex flex-col gap-4">
          <TextField label="الاسم" />
          <Tabs>
            <TabList aria-label="الإعدادات">
              <Tab id="a">الملف الشخصي</Tab>
              <Tab id="b">الفواتير</Tab>
            </TabList>
            <TabPanel id="a">بيانات الحساب.</TabPanel>
            <TabPanel id="b">طرق الدفع.</TabPanel>
          </Tabs>
        </Direction>
      </div>
    </div>
  );
}
