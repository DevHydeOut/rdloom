import { useAsyncList } from "react-aria-components";
import { Combobox, ComboboxItem } from "@rdloom/react";

interface User {
  id: string;
  name: string;
}

const directory: User[] = Array.from({ length: 200 }, (_, i) => ({ id: `u${i}`, name: `User ${i + 1}` }));

/** Stands in for your API: 20 results per page. */
async function searchUsers(query: string, cursor: number) {
  await new Promise((r) => setTimeout(r, 300));
  const matches = directory.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));
  const next = cursor + 20;
  return { items: matches.slice(cursor, next), next: next < matches.length ? next : undefined };
}

export default function ComboboxAsyncExample() {
  // useAsyncList handles filtering, paging and out-of-order responses.
  const users = useAsyncList<User, number>({
    async load({ filterText, cursor = 0 }) {
      const page = await searchUsers(filterText ?? "", cursor);
      return { items: page.items, cursor: page.next };
    },
  });
  return (
    <Combobox
      className="w-64"
      label="Assignee"
      placeholder="Find a user"
      items={users.items}
      inputValue={users.filterText}
      onInputChange={users.setFilterText}
      isLoading={users.isLoading}
      onLoadMore={users.loadMore}
      menuTrigger="focus"
    >
      {(u) => <ComboboxItem id={u.id}>{u.name}</ComboboxItem>}
    </Combobox>
  );
}
