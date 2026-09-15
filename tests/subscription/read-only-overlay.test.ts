import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReadOnlyOverlay } from "@/features/subscription/components/ReadOnlyOverlay";
import { SUBSCRIPTION_COPY } from "@/lib/subscription/copy";

function render(status: "TRIALING" | "ACTIVE" | "EXPIRED" | "REJECTED" | "PENDING_REVIEW") {
  return renderToStaticMarkup(
    createElement(
      ReadOnlyOverlay,
      { status },
      createElement("button", { type: "button" }, "فرم نوشتن"),
    ),
  );
}

describe("ReadOnlyOverlay", () => {
  it("passes write actions through while TRIALING or ACTIVE", () => {
    expect(render("TRIALING")).toContain("<button");
    expect(render("TRIALING")).toContain("فرم نوشتن");
    expect(render("ACTIVE")).toContain("<button");
  });

  it("replaces write actions in EXPIRED and REJECTED", () => {
    expect(render("EXPIRED")).not.toContain("<button");
    expect(render("EXPIRED")).toContain(SUBSCRIPTION_COPY.readOnly);
    expect(render("REJECTED")).not.toContain("<button");
    expect(render("REJECTED")).toContain(SUBSCRIPTION_COPY.readOnly);
  });

  it("also blocks writes while a receipt is pending review", () => {
    expect(render("PENDING_REVIEW")).not.toContain("<button");
    expect(render("PENDING_REVIEW")).toContain(SUBSCRIPTION_COPY.receiptPending);
  });
});
