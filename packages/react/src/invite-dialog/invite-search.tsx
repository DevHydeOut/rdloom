"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ListBox, ListBoxItem, Button as AriaButton } from "react-aria-components";
import { Avatar } from "../avatar/avatar";
import { cx } from "../utils/cx";
import { CheckIcon, CloseIcon, PlusIcon } from "../utils/icons";
import {
  RoleSelect,
  ScrollList,
  SearchBox,
  emailShape,
  people as countPeople,
  removeButton,
  type InviteClassNames,
  type InvitePerson,
  type InviteRole,
} from "./invite-parts";

export interface PickedPerson {
  email: string;
  role: string;
  person?: InvitePerson;
}

interface SearchPickerProps {
  directory: InvitePerson[];
  onSearch?: (query: string) => InvitePerson[] | Promise<InvitePerson[]>;
  roles: InviteRole[];
  picked: PickedPerson[];
  onPicked: (next: PickedPerson[]) => void;
  startRole: string;
  known: Set<string>;
  maxInvites: number;
  maxVisibleRows: number;
  classNames?: InviteClassNames;
}

const key = (email: string) => email.trim().toLowerCase();

/** The search variant: look people up, pick them into a to-invite list with a role each. */
export function SearchPicker({
  directory,
  onSearch,
  roles,
  picked,
  onPicked,
  startRole,
  known,
  maxInvites,
  maxVisibleRows,
  classNames,
}: SearchPickerProps) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<InvitePerson[]>(directory);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const latest = useRef(0);
  const results = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    const run = ++latest.current;
    if (onSearch && q) {
      setLoading(true);
      Promise.resolve(onSearch(q))
        .then((list) => {
          if (run === latest.current) setFound(list);
        })
        .catch(() => {
          if (run === latest.current) setFound([]);
        })
        .finally(() => {
          if (run === latest.current) setLoading(false);
        });
      return;
    }
    setLoading(false);
    const lower = q.toLowerCase();
    setFound(lower ? directory.filter((p) => p.name.toLowerCase().includes(lower) || p.email.toLowerCase().includes(lower)) : directory);
  }, [query, onSearch, directory]);

  const chosen = new Set(picked.map((p) => key(p.email)));
  const atMax = picked.length >= maxInvites;
  const visible = found.filter((p) => !known.has(key(p.email)));
  const typed = query.trim();
  const offerEmail =
    emailShape.test(typed) &&
    !known.has(key(typed)) &&
    !chosen.has(key(typed)) &&
    !visible.some((p) => key(p.email) === key(typed)) &&
    !directory.some((p) => key(p.email) === key(typed));

  const add = (person: InvitePerson | undefined, email: string) => {
    if (chosen.has(key(email))) return;
    if (atMax) {
      setAnnouncement(`You can invite up to ${maxInvites} people at once.`);
      return;
    }
    onPicked([...picked, { email, role: startRole, person }]);
    setAnnouncement(`${person?.name ?? email} added. ${countPeople(picked.length + 1)} to invite.`);
  };
  const remove = (email: string, name: string) => {
    onPicked(picked.filter((p) => key(p.email) !== key(email)));
    setAnnouncement(`${name} removed.`);
  };

  const first = visible[0];
  const onSearchKey = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!typed) return;
      if (first) add(first, first.email);
      else if (offerEmail) add(undefined, typed);
    } else if (event.key === "ArrowDown") {
      const option = results.current?.querySelector<HTMLElement>('[role="option"]');
      if (option) {
        event.preventDefault();
        option.focus();
      }
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className={cx("flex flex-col gap-2", classNames?.search)}>
        <SearchBox label="Search people" placeholder="Search by name or email" value={query} onChange={setQuery} onKeyDown={onSearchKey} autoFocus />
        <div ref={results} className={classNames?.results}>
          <ScrollList rows={3} rowHeight="2.75rem" gap="0.125rem" watch={`${query}${visible.length}${loading}`}>
            <ListBox
              aria-label="Search results"
              selectionMode="none"
              onAction={(id) => {
                if (id === "__email") return add(undefined, typed);
                const person = visible.find((p) => p.id === id);
                if (person) add(person, person.email);
              }}
              className="flex flex-col gap-0.5 outline-none"
              renderEmptyState={() => (
                <p className="px-2 py-3 text-center text-sm text-[var(--rd-color-text-muted)]">{loading ? "Searching" : "No one found."}</p>
              )}
            >
              {visible.map((p) => {
                const added = chosen.has(key(p.email));
                return (
                  <ListBoxItem key={p.id} id={p.id} textValue={added ? `${p.name}, ${p.email}, added` : `${p.name}, ${p.email}`} className={resultRow}>
                    <Avatar name={p.name} src={p.avatarUrl} size="sm" decorative />
                    <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                    <span className="hidden min-w-0 truncate text-[var(--rd-color-text-muted)] sm:block">{p.email}</span>
                    {added && <CheckIcon />}
                  </ListBoxItem>
                );
              })}
              {offerEmail && (
                <ListBoxItem id="__email" textValue={`Invite ${typed}`} className={resultRow}>
                  <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--rd-color-border-strong)]">
                    <PlusIcon className="size-4 text-[var(--rd-color-text-muted)]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    Invite <span className="font-medium">{typed}</span>
                  </span>
                </ListBoxItem>
              )}
            </ListBox>
          </ScrollList>
        </div>
      </div>

      <div className={cx("flex flex-col gap-2", classNames?.list)}>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium">To invite</h3>
          <span className={cx("text-xs text-[var(--rd-color-text-muted)]", classNames?.counter)}>{countPeople(picked.length)}</span>
        </div>
        {picked.length === 0 ? (
          <p className="rounded-[var(--rd-radius-control)] border border-dashed border-[var(--rd-color-border-default)] px-3 py-4 text-center text-sm text-[var(--rd-color-text-muted)]">
            No one yet. Search above and pick people.
          </p>
        ) : (
          <ScrollList rows={maxVisibleRows} rowHeight="2.5rem" watch={picked.length}>
            <ul className="flex flex-col gap-2">
              {picked.map((entry) => {
                const name = entry.person?.name ?? entry.email;
                return (
                  <li key={key(entry.email)} className="flex items-center gap-2">
                    <Avatar name={name} src={entry.person?.avatarUrl} size="sm" decorative />
                    <div className="min-w-0 flex-1 text-sm leading-tight">
                      <div className="truncate font-medium">{name}</div>
                      {entry.person && <div className="truncate text-xs text-[var(--rd-color-text-muted)]">{entry.email}</div>}
                    </div>
                    <RoleSelect
                      label={`Role for ${name}`}
                      roles={roles}
                      value={entry.role}
                      onChange={(role) => onPicked(picked.map((p) => (p === entry ? { ...p, role } : p)))}
                      className="w-32 shrink-0 sm:w-36"
                    />
                    <AriaButton aria-label={`Remove ${name}`} onPress={() => remove(entry.email, name)} className={removeButton}>
                      <CloseIcon className="size-4" />
                    </AriaButton>
                  </li>
                );
              })}
            </ul>
          </ScrollList>
        )}
        {atMax && <p className="text-xs text-[var(--rd-color-text-muted)]">You can invite up to {maxInvites} people at once.</p>}
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}

const resultRow =
  "flex min-h-11 cursor-default items-center gap-3 rounded-[var(--rd-radius-control)] px-2 py-1.5 text-sm outline-none " +
  "text-[var(--rd-color-text-default)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[focused]:bg-[var(--rd-color-surface-subtle)] " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";
