import { Card, CardBand, CardBody, CardDescription, CardMeta, CardTitle } from "@rdloom/react";

function Chip({ children }: { children: string }) {
  return (
    <li className="rounded-full border border-[var(--rd-color-border-default)] px-2.5 py-0.5 text-xs font-medium tracking-wide text-[var(--rd-color-text-default)]">
      {children}
    </li>
  );
}

// A made-up mark: two overlapping shapes.
function Mark() {
  return (
    <span aria-hidden="true" className="relative block size-11 overflow-hidden rounded-xl bg-[var(--rd-color-text-default)]">
      <span className="absolute -start-1 top-2 size-6 rounded-full bg-[var(--rd-color-surface-default)]" />
      <span className="absolute bottom-1.5 end-1.5 size-4 rotate-45 rounded-sm bg-[var(--rd-color-action-primary)]" />
    </span>
  );
}

function Listing({ title, salary, tags, posted, tone }: { title: string; salary: string; tags: string[]; posted: string; tone: "peach" | "lilac" | "rose" }) {
  return (
    <Card padding="none" rounded="large" variant="floating">
      <CardBody>
        <Mark />
        <div className="flex flex-col gap-0.5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{salary}</CardDescription>
        </div>
        <CardMeta aria-label="Job details" className="gap-2">
          {tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </CardMeta>
      </CardBody>
      <CardBand tone={tone}>{posted}</CardBand>
    </Card>
  );
}

export default function CardJobListingExample() {
  return (
    <div className="grid w-[40rem] max-w-full gap-4 sm:grid-cols-2">
      <Listing title="Senior product designer" salary="$3,500-5,500 net" tags={["FULL TIME", "REMOTE"]} posted="Posted 2 days ago" tone="peach" />
      <Listing title="Frontend engineer" salary="$4,000-6,000 net" tags={["FULL TIME", "HYBRID"]} posted="Posted 5 days ago" tone="lilac" />
    </div>
  );
}
