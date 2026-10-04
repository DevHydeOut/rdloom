import { useAsyncList } from "react-aria-components";
import { Combobox, ComboboxItem } from "@rdloom/react";

const countries = [
  "Argentina", "Australia", "Brazil", "Canada", "China", "Egypt", "France", "Germany", "India",
  "Indonesia", "Italy", "Japan", "Kenya", "Mexico", "Netherlands", "Nigeria", "Norway", "Poland",
  "Singapore", "South Africa", "Spain", "Sweden", "Switzerland", "United Kingdom", "United States",
].map((name) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name }));

const bigList = Array.from({ length: 5000 }, (_, i) => ({ id: `sku-${i + 1}`, name: `Product #${i + 1}` }));

interface User {
  id: string;
  name: string;
}

// Stands in for a paginated search API with a little latency.
const directory: User[] = Array.from({ length: 120 }, (_, i) => ({ id: `u${i}`, name: `User ${String(i + 1).padStart(3, "0")}` }));
function searchUsers(query: string, cursor = 0): Promise<{ items: User[]; next?: number }> {
  const matches = directory.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));
  return new Promise((resolve) =>
    setTimeout(() => {
      const next = cursor + 20;
      resolve({ items: matches.slice(cursor, next), next: next < matches.length ? next : undefined });
    }, 400),
  );
}

export function ComboboxDemo() {
  const users = useAsyncList<User, number>({
    async load({ filterText, cursor }) {
      const page = await searchUsers(filterText ?? "", cursor);
      return { items: page.items, cursor: page.next };
    },
  });

  return (
    <>
      <Combobox className="w-64" label="Country" placeholder="Search countries" defaultItems={countries}>
        {(c) => <ComboboxItem id={c.id}>{c.name}</ComboboxItem>}
      </Combobox>

      <Combobox
        className="w-72"
        label="Markets"
        selectionMode="multiple"
        placeholder="Add markets"
        defaultItems={countries}
        defaultValue={["india", "japan"]}
      >
        {(c) => <ComboboxItem id={c.id}>{c.name}</ComboboxItem>}
      </Combobox>

      <Combobox
        className="w-64"
        label="Assignee"
        description="Searches as you type"
        placeholder="Find a user"
        items={users.items}
        inputValue={users.filterText}
        onInputChange={users.setFilterText}
        isLoading={users.loadingState === "loading" || users.loadingState === "filtering" || users.loadingState === "loadingMore"}
        onLoadMore={users.loadMore}
        menuTrigger="focus"
      >
        {(u) => <ComboboxItem id={u.id}>{u.name}</ComboboxItem>}
      </Combobox>

      <Combobox className="w-64" label="Product (5,000)" virtualized defaultItems={bigList} placeholder="Search products">
        {(p) => <ComboboxItem id={p.id}>{p.name}</ComboboxItem>}
      </Combobox>
    </>
  );
}
