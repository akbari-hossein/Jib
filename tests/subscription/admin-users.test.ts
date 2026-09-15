import { describe, expect, it } from "vitest";
import {
  ADMIN_USER_STATUS_FILTERS,
  adminSubscriberExposesReceiptSecrets,
  adminUsersWhere,
  parseAdminUsersQuery,
  serializeAdminSubscriber,
} from "@/lib/subscription/admin-users";
import { authorizeAdminList } from "@/lib/subscription/api-access";

describe("GET /api/admin/users query parsing", () => {
  it("defaults status, page, and pageSize independently of search", () => {
    expect(parseAdminUsersQuery({})).toEqual({
      status: "ALL",
      search: "",
      page: 1,
      pageSize: 25,
    });
  });

  it("applies status, search, and pagination independently and together", () => {
    expect(parseAdminUsersQuery({ status: "ACTIVE" }).status).toBe("ACTIVE");
    expect(parseAdminUsersQuery({ search: "  0912  " }).search).toBe("0912");
    expect(parseAdminUsersQuery({ page: "3", pageSize: "10" })).toMatchObject({
      page: 3,
      pageSize: 10,
    });
    expect(
      parseAdminUsersQuery({
        status: "EXPIRED",
        search: "ali",
        page: "2",
        pageSize: "25",
      }),
    ).toEqual({
      status: "EXPIRED",
      search: "ali",
      page: 2,
      pageSize: 25,
    });
  });

  it("rejects unknown status values instead of inventing a filter", () => {
    expect(parseAdminUsersQuery({ status: "PREMIUM" }).status).toBe("ALL");
    expect(ADMIN_USER_STATUS_FILTERS).toContain("PENDING_REVIEW");
  });
});

describe("admin users where clause", () => {
  it("filters by subscription status without loading all users", () => {
    expect(adminUsersWhere({ status: "ACTIVE", search: "" })).toEqual({
      AND: [{ subscription: { is: { status: "ACTIVE" } } }],
    });
  });

  it("searches phone (email) and name together with a status filter", () => {
    expect(adminUsersWhere({ status: "TRIALING", search: "0912" })).toEqual({
      AND: [
        { subscription: { is: { status: "TRIALING" } } },
        {
          OR: [
            { email: { contains: "0912", mode: "insensitive" } },
            { name: { contains: "0912", mode: "insensitive" } },
          ],
        },
      ],
    });
  });

  it("does not add a status predicate for ALL", () => {
    expect(adminUsersWhere({ status: "ALL", search: "ali" })).toEqual({
      AND: [
        {
          OR: [
            { email: { contains: "ali", mode: "insensitive" } },
            { name: { contains: "ali", mode: "insensitive" } },
          ],
        },
      ],
    });
  });
});

describe("admin users serialization", () => {
  it("returns summary fields only — never receipt image or text", () => {
    const dto = serializeAdminSubscriber({
      id: "user-1",
      email: "09120000000@jib.app",
      name: "علی",
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
      subscription: {
        status: "ACTIVE",
        trialEndsAt: new Date("2026-09-15T00:00:00.000Z"),
        currentPeriodEnd: new Date("2026-10-15T00:00:00.000Z"),
      },
      totalPaidToman: 59_000,
      lastPaymentAt: new Date("2026-09-16T00:00:00.000Z"),
    });

    expect(dto).toEqual({
      userId: "user-1",
      phone: "09120000000@jib.app",
      name: "علی",
      subscriptionStatus: "ACTIVE",
      trialEndsAt: "2026-09-15T00:00:00.000Z",
      currentPeriodEnd: "2026-10-15T00:00:00.000Z",
      totalPaidToman: 59_000,
      lastPaymentAt: "2026-09-16T00:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
    });
    expect(adminSubscriberExposesReceiptSecrets(dto)).toBe(false);
  });
});

describe("admin metrics and users gate", () => {
  it("returns 403 for a non-admin on metrics and users list helpers", () => {
    expect(authorizeAdminList({ role: "USER", status: "ACTIVE" })).toEqual({
      allowed: false,
      status: 403,
    });
    expect(authorizeAdminList({ role: "ADMIN", status: "ACTIVE" })).toEqual({ allowed: true });
  });
});
