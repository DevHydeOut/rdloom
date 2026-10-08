"use client";

import { useState } from "react";
import { ListBox, ListBoxItem, type Selection } from "react-aria-components";
import { cx } from "../utils/cx";
import { UsersIcon } from "../utils/icons";
import { CheckCircle, RoleSelect, ScrollList, SearchBox, type InviteClassNames, type InvitePerson, type InviteRole } from "./invite-parts";

export interface ListFlowState {
  step: 1 | 2;
  /** Ids of the chosen people, in the order of the directory. */
  picked: string[];
  roleOf: Record<string, string>;
}

const rowHeight = "2.75rem";

/** The counters shown at the end of the header: how many are chosen and how many there are. */
export function StepCounters({ step, picked, total }: { step: 1 | 2; picked: number; total: number }) {
  const item = (text: string) => (
    <span className="inline-flex items-center gap-1 text-xs font-normal text-[var(--rd-color-text-muted)]">
      <UsersIcon className="size-3.5 shrink-0" />
      {text}
    </span>
  );
  return (
    <span className="flex items-center gap-3">
      {step === 1 ? (
        <>
          {item(`${picked} selected`)}
          {item(`${total} users`)}
        </>
      ) : (
        item(`${picked} ${picked === 1 ? "user" : "users"}`)
      )}
    </span>
  );
}

const optionRow =
  "flex min-h-11 w-full cursor-default items-center gap-3 rounded-[var(--rd-radius-control)] px-2 py-2 text-sm outline-none " +
  "text-[var(--rd-color-text-default)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[focused]:bg-[var(--rd-color-surface-subtle)] " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

/** Step 1: search, then tick people. Every row is one toggle. */
export function PickStep({
  directory,
  picked,
  onPicked,
  maxVisibleRows,
  classNames,
}: {
  directory: InvitePerson[];
  picked: string[];
  onPicked: (ids: string[]) => void;
  maxVisibleRows: number;
  classNames?: InviteClassNames;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? directory.filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)) : directory;
  const onChange = (selection: Selection) => {
    const next = selection === "all" ? new Set(shown.map((p) => p.id)) : new Set([...selection].map(String));
    onPicked(directory.filter((p) => next.has(p.id)).map((p) => p.id));
  };
  return (
    <div className={cx("flex min-w-0 flex-col gap-3", classNames?.list)}>
      <SearchBox
        label="Search user"
        placeholder="Search user"
        value={query}
        onChange={setQuery}
        className={classNames?.search}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
      />
      <ScrollList rows={maxVisibleRows} rowHeight={rowHeight} gap="0.125rem" watch={`${q}${shown.length}`} className={classNames?.results}>
        <ListBox
          aria-label="Choose users"
          selectionMode="multiple"
          selectionBehavior="toggle"
          selectedKeys={new Set(picked)}
          onSelectionChange={onChange}
          className="flex flex-col gap-0.5 outline-none"
          renderEmptyState={() => <p className="px-2 py-4 text-center text-sm text-[var(--rd-color-text-muted)]">No one found.</p>}
        >
          {shown.map((p) => (
            <ListBoxItem key={p.id} id={p.id} textValue={`${p.name}, ${p.email}`} className={optionRow}>
              {({ isSelected }) => (
                <>
                  <CheckCircle checked={isSelected} />
                  <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                  <span className="min-w-0 max-w-[45%] truncate text-[var(--rd-color-text-muted)]">{p.email}</span>
                </>
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </ScrollList>
    </div>
  );
}

/** Step 2: the chosen people, each with a role. */
export function RoleStep({
  directory,
  picked,
  roleOf,
  roles,
  startRole,
  onRole,
  maxVisibleRows,
  classNames,
}: {
  directory: InvitePerson[];
  picked: string[];
  roleOf: Record<string, string>;
  roles: InviteRole[];
  startRole: string;
  onRole: (id: string, role: string) => void;
  maxVisibleRows: number;
  classNames?: InviteClassNames;
}) {
  const chosen = directory.filter((p) => picked.includes(p.id));
  return (
    <ScrollList rows={maxVisibleRows} rowHeight="3.25rem" gap="0.25rem" watch={chosen.length} className={classNames?.list}>
      <ul aria-label="People and their roles" className="flex flex-col gap-1">
        {chosen.map((p) => (
          <li key={p.id} className="flex min-h-12 items-center gap-3 px-2 py-1">
            <CheckCircle checked />
            <div className="min-w-0 flex-1 text-sm leading-tight">
              <div className="truncate font-medium">{p.name}</div>
              <div className="truncate text-xs text-[var(--rd-color-text-muted)]">{p.email}</div>
            </div>
            <RoleSelect
              label={`Role for ${p.name}`}
              roles={roles}
              value={roleOf[p.id] ?? startRole}
              onChange={(role) => onRole(p.id, role)}
              className="w-32 shrink-0 sm:w-36"
            />
          </li>
        ))}
      </ul>
    </ScrollList>
  );
}
