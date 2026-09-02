import { describe, expect, it } from "vitest";
import { ADMIN_POLICY_ERRORS, canChangeUserRole, canChangeUserStatus, canDeleteUser } from "@/lib/admin/policies";

describe("admin user policies", () => {
  it("blocks self status and self delete", () => {
    expect(canChangeUserStatus({ actorId: "a", targetId: "a" })).toEqual({
      ok: false,
      error: ADMIN_POLICY_ERRORS.selfStatus,
    });
    expect(canDeleteUser({ actorId: "a", targetId: "a", targetRole: "USER", adminCount: 2 })).toEqual({
      ok: false,
      error: ADMIN_POLICY_ERRORS.selfDelete,
    });
  });

  it("protects the last admin", () => {
    expect(
      canChangeUserRole({
        actorId: "a",
        targetId: "b",
        targetRole: "ADMIN",
        nextRole: "USER",
        adminCount: 1,
      }),
    ).toEqual({ ok: false, error: ADMIN_POLICY_ERRORS.lastAdminRole });

    expect(
      canDeleteUser({
        actorId: "a",
        targetId: "b",
        targetRole: "ADMIN",
        adminCount: 1,
      }),
    ).toEqual({ ok: false, error: ADMIN_POLICY_ERRORS.lastAdminDelete });
  });

  it("allows mutating other users when another admin remains", () => {
    expect(canChangeUserStatus({ actorId: "a", targetId: "b" })).toEqual({ ok: true });
    expect(
      canChangeUserRole({
        actorId: "a",
        targetId: "b",
        targetRole: "USER",
        nextRole: "ADMIN",
        adminCount: 1,
      }),
    ).toEqual({ ok: true });
    expect(
      canDeleteUser({
        actorId: "a",
        targetId: "b",
        targetRole: "USER",
        adminCount: 1,
      }),
    ).toEqual({ ok: true });
  });
});
