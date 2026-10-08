import {
  AvatarGroup,
  Badge,
  BellIcon,
  Button,
  CalendarIcon,
  Card,
  CardActions,
  CardDescription,
  CardFooter,
  CardHeader,
  CardIconButton,
  CardTitle,
  ChevronRightIcon,
  CloseIcon,
  PinIcon,
  StarIcon,
  UsersIcon,
} from "@rdloom/react";
import type { ReactNode } from "react";

function Row({ icon, label, children, highlighted }: { icon: ReactNode; label: string; children: ReactNode; highlighted?: boolean }) {
  return (
    <li
      className={
        "flex items-center gap-3 rounded-[var(--rd-radius-control)] px-3 py-2 " +
        (highlighted ? "bg-[var(--rd-color-surface-selected)]" : "")
      }
    >
      <span className="text-[var(--rd-color-text-muted)]">{icon}</span>
      <span className="text-[var(--rd-color-text-muted)]">{label}</span>
      <span className="ms-auto flex items-center gap-2 font-medium">{children}</span>
    </li>
  );
}

export default function CardDetailPanelExample() {
  return (
    <div className="w-[28rem] max-w-full">
      <Card variant="floating" rounded="large" padding="sm">
        <CardHeader className="gap-3 rounded-[calc(var(--rd-radius-media)-0.5rem)] bg-[var(--rd-color-surface-subtle)] p-4">
          <div className="flex flex-wrap items-start gap-3">
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--rd-color-action-primary)] text-[var(--rd-color-action-on-primary)]">
              <CalendarIcon className="size-5" />
            </span>
            <div className="flex min-w-40 flex-1 flex-col">
              <CardTitle>Brand identity review</CardTitle>
              <CardDescription>Thu, Mar 14 · 10:00 to 11:00</CardDescription>
            </div>
            <CardActions className="ms-auto gap-1">
              <CardIconButton label="Turn on reminders" tone="ghost" className="size-8">
                <BellIcon />
              </CardIconButton>
              <CardIconButton label="Pin to top" tone="ghost" className="size-8">
                <PinIcon />
              </CardIconButton>
              <CardIconButton label="Close details" tone="ghost" className="size-8">
                <CloseIcon className="size-4" />
              </CardIconButton>
            </CardActions>
          </div>
          <div className="flex items-center gap-2">
            <AvatarGroup
              size="sm"
              label="Marketing team"
              avatars={[{ name: "Ada Lovelace" }, { name: "Grace Hopper" }, { name: "Katherine Johnson" }]}
            />
            <span className="text-[var(--rd-color-text-muted)]">with Marketing team</span>
          </div>
        </CardHeader>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          <Row icon={<StarIcon />} label="Priority">
            <Badge variant="warning">
              <StarIcon filled className="size-3" />
              High
            </Badge>
          </Row>
          <Row icon={<UsersIcon />} label="Attendees" highlighted>
            8 people
            <CardIconButton label="Show attendees" tone="ghost" className="size-8">
              <ChevronRightIcon />
            </CardIconButton>
          </Row>
        </ul>
        <CardFooter className="justify-end">
          <Button variant="secondary" size="sm">
            Skip
          </Button>
          <Button variant="secondary" size="sm">
            Reschedule
          </Button>
          <Button size="sm">Join</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
