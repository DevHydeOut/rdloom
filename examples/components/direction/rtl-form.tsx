import { Direction, Tab, TabList, TabPanel, Tabs, TextField } from "@rdloom/react";

export default function DirectionRtlFormExample() {
  return (
    <div className="flex w-full justify-center">
      <Direction direction="rtl" lang="ar" className="flex w-full max-w-sm flex-col gap-4">
        <TextField label="الاسم" description="كما يظهر في الفاتورة." />
        <Tabs>
          <TabList aria-label="الإعدادات">
            <Tab id="profile">الملف الشخصي</Tab>
            <Tab id="billing">الفواتير</Tab>
            <Tab id="team">الفريق</Tab>
          </TabList>
          <TabPanel id="profile">بيانات الحساب.</TabPanel>
          <TabPanel id="billing">طرق الدفع والفواتير.</TabPanel>
          <TabPanel id="team">أعضاء الفريق وأدوارهم.</TabPanel>
        </Tabs>
      </Direction>
    </div>
  );
}
