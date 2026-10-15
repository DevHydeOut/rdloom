import { SpotlightCard } from "@rdloom/react";

const items = [
  { title: "Invoices", text: "Send and track what is owed." },
  { title: "Customers", text: "Everyone you bill, in one list." },
  { title: "Reports", text: "Monthly totals you can export." },
];

export default function SpotlightCardGridExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <SpotlightCard key={item.title} size={180}>
            <h3 className="text-sm font-medium">{item.title}</h3>
            <p className="mt-1 text-sm text-[var(--rd-color-text-muted)]">{item.text}</p>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
