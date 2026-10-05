import { Button, EmptyState } from "@rdloom/react";

const SearchIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="5.75" stroke="currentColor" strokeWidth="1.5" />
    <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function EmptyStateNoResultsExample() {
  return (
    <div className="w-[28rem] max-w-full">
      <EmptyState icon={<SearchIcon />} title="No results for “invoice”" description="Check the spelling or try a broader search.">
        <Button variant="secondary">Clear search</Button>
      </EmptyState>
    </div>
  );
}
