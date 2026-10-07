import type { ReactNode } from "react";
import { resolvePermission, type PermissionValue } from "../utils/permissions";

// The navigation of a dashboard, as data: groups of items, each of which may open a short list of
// sub-items. The shell draws it; the functions here answer questions about it.

export interface NavItem {
  /** A stable id. The current page is named by it. */
  id: string;
  label: string;
  /** Where it goes. Without one the item is a button and `onNavigate` does the work. */
  href?: string;
  /** A 16-unit icon. Without one the first letter of the label is shown (the collapsed sidebar shows only icons). */
  icon?: ReactNode;
  /** A small count or word beside the label, e.g. 3 or "New". */
  badge?: string | number;
  /** One level of sub-items. The item itself then opens and closes the list instead of going anywhere. */
  children?: NavItem[];
  /**
   * What the app allows for this item: "allow" (default), "disabled" (shown, not followed, with the reason in a tooltip) or
   * "hidden" (not drawn). This only changes what people see; the server must check access again.
   */
  permission?: PermissionValue;
}

export interface NavGroup {
  /** A heading for the group, e.g. "Workspace". Omit it for a group without one. */
  label?: string;
  items: NavItem[];
}

export interface ShellUser {
  name: string;
  email?: string;
  avatarUrl?: string;
  /** Entries of the account menu, e.g. Settings and Sign out. */
  menu?: Array<{ id: string; label: string; onSelect: () => void; variant?: "default" | "danger" }>;
}

/** An organisation, workspace or project the person can switch between. */
export interface ShellTeam {
  id?: string;
  name: string;
  /** A second line, e.g. the plan: "Enterprise". */
  description?: string;
  /** Your logo, 20 px or so. Without one the first letter of the name is shown. */
  logo?: ReactNode;
}

/** Every item in order, sub-items included. */
export function flattenNav(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]));
}

/** The item with this id, wherever it is. */
export const findNavItem = (groups: NavGroup[], id: string | undefined): NavItem | undefined => (id === undefined ? undefined : flattenNav(groups).find((i) => i.id === id));

/** The top-level item that holds the current page: itself, or the parent of the current sub-item. */
export function currentTopLevel(groups: NavGroup[], currentId: string | undefined): NavItem | undefined {
  if (currentId === undefined) return undefined;
  for (const group of groups) {
    for (const item of group.items) {
      if (item.id === currentId || item.children?.some((c) => c.id === currentId)) return item;
    }
  }
  return undefined;
}

/** "Customers" for a page, or "Workspace / Customers" style trail of labels from the group to the item. */
export function trailOf(groups: NavGroup[], currentId: string | undefined): string[] {
  if (currentId === undefined) return [];
  for (const group of groups) {
    for (const item of group.items) {
      if (item.id === currentId) return [item.label];
      const child = item.children?.find((c) => c.id === currentId);
      if (child) return [item.label, child.label];
    }
  }
  return [];
}

/** The letter shown for an item with no icon. */
export const initialOf = (label: string) => (label.trim()[0] ?? "?").toUpperCase();

/** A badge as the text a screen reader should hear after the label. */
export const badgeText = (badge: string | number | undefined) => (badge === undefined || badge === "" ? "" : typeof badge === "number" ? `${badge}` : badge);

/** What a navigation item shows: its answer for the current person. */
export const navPermission = (item: NavItem) => resolvePermission(item.permission);

/**
 * The navigation as people may see it: hidden items are removed, a parent whose children are all hidden goes too,
 * and a group left with nothing is dropped. Disabled items stay.
 */
export function visibleNav(groups: NavGroup[]): NavGroup[] {
  const result: NavGroup[] = [];
  for (const group of groups) {
    const items: NavItem[] = [];
    for (const item of group.items) {
      if (!navPermission(item).isVisible) continue;
      if (item.children?.length) {
        const children = item.children.filter((c) => navPermission(c).isVisible);
        if (children.length === 0) continue;
        items.push({ ...item, children });
      } else items.push(item);
    }
    if (items.length) result.push({ ...group, items });
  }
  return result;
}
