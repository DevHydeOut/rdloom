import { describe, expect, it } from "vitest";
import { can, permissionFor, permissionsFrom, resolvePermission } from "../src/utils/permissions";

describe("permissions", () => {
  it("allows an action that was not mentioned", () => {
    expect(resolvePermission(undefined)).toMatchObject({ state: "allow", isAllowed: true, isVisible: true, isDisabled: false });
    expect(can({}, "delete")).toBe(true);
    expect(can(undefined, "delete")).toBe(true);
  });

  it("reads the short forms: true allows, false disables", () => {
    expect(resolvePermission(true).isAllowed).toBe(true);
    expect(resolvePermission(false)).toMatchObject({ state: "disabled", isDisabled: true, isVisible: true, isAllowed: false });
  });

  it("reads the three states by name", () => {
    expect(resolvePermission("allow").isAllowed).toBe(true);
    expect(resolvePermission("disabled").isDisabled).toBe(true);
    expect(resolvePermission("hidden")).toMatchObject({ isVisible: false, isDisabled: false, isAllowed: false });
  });

  it("keeps the reason the app gave", () => {
    const p = permissionFor({ delete: { state: "disabled", reason: "Only admins can delete" } }, "delete");
    expect(p.reason).toBe("Only admins can delete");
    expect(p.isDisabled).toBe(true);
  });

  it("looks an action up in a block's permissions", () => {
    const permissions = { edit: true, delete: "hidden", refund: false } as const;
    expect(can(permissions, "edit")).toBe(true);
    expect(permissionFor(permissions, "delete").isVisible).toBe(false);
    expect(permissionFor(permissions, "refund").isDisabled).toBe(true);
  });

  it("builds permissions from a yes/no function, with a reason", () => {
    const permissions = permissionsFrom(["edit", "delete"] as const, (action) => action === "edit", () => "Ask an admin");
    expect(permissions.edit).toBe(true);
    expect(permissionFor(permissions, "delete")).toMatchObject({ state: "disabled", reason: "Ask an admin" });
  });
});
