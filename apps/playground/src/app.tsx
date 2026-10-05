import { useEffect, useState, type ReactNode } from "react";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  Button,
  Calendar,
  Checkbox,
  DatePicker,
  DateRangePicker,
  defaultDateRangePresets,
  Dialog,
  DialogTrigger,
  Popover,
  PopoverTrigger,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  toast,
  ToastRegion,
  Tooltip,
  TooltipTrigger,
} from "@rdloom/react";
import { ComboboxDemo } from "./combobox-demo";
import { DataGridDemo, EditableGridDemo, SERVER_ROWS, ServerGridDemo } from "./data-grid-demo";

type Theme = "light" | "dark";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-[var(--rd-color-border-default)] py-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--rd-color-text-muted)]">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

export function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <div>
          <h1 className="text-2xl font-semibold">rdloom playground</h1>
          <p className="text-sm text-[var(--rd-color-text-muted)]">Every component, generated from its spec.</p>
        </div>
        <Switch isSelected={theme === "dark"} onChange={(on) => setTheme(on ? "dark" : "light")}>
          Dark mode
        </Switch>
      </header>

      <Section title="Button">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button isLoading>Saving</Button>
        <Button isDisabled>Disabled</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </Section>

      <Section title="TextField">
        <TextField className="w-64" label="Email" placeholder="you@company.com" description="We'll never share it." />
        <TextField className="w-64" label="Username" isRequired isInvalid errorMessage="This username is taken." />
        <TextField className="w-64" label="Notes" multiline placeholder="Anything else?" />
      </Section>

      <Section title="Checkbox, Switch, RadioGroup">
        <div className="flex flex-col gap-3">
          <Checkbox defaultSelected>Email me updates</Checkbox>
          <Checkbox isIndeterminate>Select all rows</Checkbox>
          <Checkbox isInvalid>I accept the terms</Checkbox>
          <Checkbox isDisabled>Disabled</Checkbox>
        </div>
        <div className="flex flex-col gap-3">
          <Switch defaultSelected>Notifications</Switch>
          <Switch size="sm">Compact mode</Switch>
          <Switch isDisabled>Disabled</Switch>
        </div>
        <RadioGroup label="Plan" defaultValue="pro">
          <Radio value="free">Free</Radio>
          <Radio value="pro">Pro</Radio>
          <Radio value="team">Team</Radio>
        </RadioGroup>
      </Section>

      <Section title="Select">
        <Select className="w-64" label="Country" defaultSelectedKey="in">
          <SelectItem id="in">India</SelectItem>
          <SelectItem id="us">United States</SelectItem>
          <SelectItem id="de">Germany</SelectItem>
          <SelectItem id="jp">Japan</SelectItem>
        </Select>
        <Select className="w-64" label="Role" isRequired>
          <SelectItem id="admin">Admin</SelectItem>
          <SelectItem id="editor">Editor</SelectItem>
          <SelectItem id="viewer">Viewer</SelectItem>
        </Select>
      </Section>

      <Section title="Data grid">
        {SERVER_ROWS ? <ServerGridDemo /> : <DataGridDemo />}
      </Section>

      <Section title="Data grid: editing and pagination">
        <EditableGridDemo />
      </Section>

      <Section title="Combobox">
        <ComboboxDemo />
      </Section>

      <Section title="Dates">
        <DatePicker className="w-64" label="Due date" description="Type it or pick it." />
        <DateRangePicker
          className="w-80"
          label="Report period"
          presets={defaultDateRangePresets}
          defaultValue={{ start: today(getLocalTimeZone()).subtract({ days: 6 }), end: today(getLocalTimeZone()) }}
        />
        <Calendar aria-label="Availability" minValue={today(getLocalTimeZone())} />
      </Section>

      <Section title="Tabs">
        <Tabs className="w-full" defaultSelectedKey="overview">
          <TabList aria-label="Project">
            <Tab id="overview">Overview</Tab>
            <Tab id="activity">Activity</Tab>
            <Tab id="settings">Settings</Tab>
          </TabList>
          <TabPanel id="overview">Overview content</TabPanel>
          <TabPanel id="activity">Activity content</TabPanel>
          <TabPanel id="settings">Settings content</TabPanel>
        </Tabs>
        <Tabs variant="pill" defaultSelectedKey="week">
          <TabList aria-label="Range">
            <Tab id="day">Day</Tab>
            <Tab id="week">Week</Tab>
            <Tab id="month">Month</Tab>
          </TabList>
          <TabPanel id="day">Daily view</TabPanel>
          <TabPanel id="week">Weekly view</TabPanel>
          <TabPanel id="month">Monthly view</TabPanel>
        </Tabs>
      </Section>

      <Section title="Overlays">
        <DialogTrigger>
          <Button variant="danger">Delete project</Button>
          <Dialog title="Delete project?" description="This permanently removes the project and its data." role="alertdialog" size="sm">
            {({ close }) => (
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onPress={close}>Cancel</Button>
                <Button
                  variant="danger"
                  onPress={() => {
                    close();
                    toast({ title: "Project deleted", variant: "success" });
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </Dialog>
        </DialogTrigger>
        <PopoverTrigger>
          <Button variant="secondary">Filters</Button>
          <Popover label="Filters" showArrow>
            <div className="flex w-56 flex-col gap-3">
              <Checkbox defaultSelected>Active</Checkbox>
              <Checkbox>Archived</Checkbox>
            </div>
          </Popover>
        </PopoverTrigger>
        <TooltipTrigger delay={300}>
          <Button variant="ghost" aria-label="Settings">⚙</Button>
          <Tooltip>Settings</Tooltip>
        </TooltipTrigger>
        <Button variant="secondary" onPress={() => toast({ title: "Upload failed", description: "Check your connection and try again.", variant: "danger" })}>
          Show error toast
        </Button>
      </Section>

      <ToastRegion />
    </div>
  );
}
