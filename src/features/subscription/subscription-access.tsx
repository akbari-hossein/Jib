"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { serializeSubscription } from "@/server/services/subscription";

export type ClientSubscriptionSnapshot = ReturnType<typeof serializeSubscription>;

const SubscriptionAccessContext = createContext<ClientSubscriptionSnapshot | null>(null);

export function SubscriptionAccessProvider({
  snapshot,
  children,
}: {
  snapshot: ClientSubscriptionSnapshot;
  children: ReactNode;
}) {
  return (
    <SubscriptionAccessContext.Provider value={snapshot}>{children}</SubscriptionAccessContext.Provider>
  );
}

export function useSubscriptionAccess(): ClientSubscriptionSnapshot | null {
  return useContext(SubscriptionAccessContext);
}
