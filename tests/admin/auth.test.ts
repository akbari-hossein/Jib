import { describe, expect, it } from "vitest";
import { isActiveAdmin, parseBootstrapAdminEmails } from "@/lib/admin/access";

describe("admin authorization helpers", () => {
  it("treats only active admins as authorized", () => {
    expect(isActiveAdmin({ role: "ADMIN", status: "ACTIVE" })).toBe(true);
    expect(isActiveAdmin({ role: "ADMIN", status: "DISABLED" })).toBe(false);
    expect(isActiveAdmin({ role: "USER", status: "ACTIVE" })).toBe(false);
    expect(isActiveAdmin(null)).toBe(false);
  });

  it("parses bootstrap emails without trusting empty values", () => {
    expect(parseBootstrapAdminEmails("")).toEqual([]);
    expect(parseBootstrapAdminEmails(" owner@jib.app , second@jib.app ")).toEqual([
      "owner@jib.app",
      "second@jib.app",
    ]);
  });
});
