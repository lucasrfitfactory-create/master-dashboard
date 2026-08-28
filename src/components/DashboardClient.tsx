"use client";

import { useCallback, useEffect, useState } from "react";
import { BusinessRevenue, DashboardPayload } from "@/types/dashboard";
import { Header } from "./Header";
import { BusinessRevenueCard } from "./BusinessRevenueCard";

// Sums only businesses that are actually connected — a disconnected
// business has no real number to add, and silently treating it as $0
// would understate the total without any indication why.
function buildTotalRevenue(businesses: BusinessRevenue[]): BusinessRevenue {
  const included = businesses.filter((b) => b.connected && b.revenueMTD !== null && b.revenueGoal !== null);
  const excluded = businesses.filter((b) => !included.includes(b));

  const revenueMTD = included.reduce((sum, b) => sum + (b.revenueMTD ?? 0), 0);
  const revenueGoal = included.reduce((sum, b) => sum + (b.revenueGoal ?? 0), 0);

  return {
    id: "total",
    name: "All Businesses",
    shortName: "Total",
    logoSrc: "",
    logoAlt: "",
    logoKind: "wordmark",
    accent: "text-amber-300",
    href: null,
    connected: included.length > 0,
    revenueMTD: included.length > 0 ? revenueMTD : null,
    revenueGoal: included.length > 0 ? revenueGoal : null,
    resolvedTab: null,
    warning:
      excluded.length > 0
        ? `Excludes ${excluded.map((b) => b.shortName).join(", ")} — not connected yet.`
        : included.length === 0
        ? "Waiting on spreadsheet access."
        : null,
  };
}

const AUTO_REFRESH_INTERVAL_MS = 15000;

async function fetchDashboard(): Promise<{ payload: DashboardPayload | null; error: string | null }> {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  const json = await res.json();
  if (!json.payload) throw new Error(json.error || "Failed to load dashboard data.");
  return json;
}

export function DashboardClient({ initial }: { initial: { payload: DashboardPayload; error: string | null } }) {
  const [state, setState] = useState(initial);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchDashboard();
      setState(result as { payload: DashboardPayload; error: string | null });
    } catch (err) {
      setState((prev) => ({ payload: prev.payload, error: err instanceof Error ? err.message : "Refresh failed" }));
    }
  }, []);

  useEffect(() => {
    const t = setInterval(refresh, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const { payload, error } = state;
  const isMock = payload.businesses.some((b) => b.resolvedTab === "MOCK");

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header monthLabel={payload.monthLabel} generatedAt={payload.generatedAt} isMock={isMock} />

      {error && (
        <div className="px-6 py-1 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs shrink-0">
          Showing last known data — refresh failed: {error}
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 flex flex-col gap-3 md:gap-4 w-full">
        {payload.businesses.map((business) => (
          <BusinessRevenueCard key={business.id} business={business} calendarProgressPct={payload.calendarProgressPct} />
        ))}
        <div className="pt-1 mt-1 border-t border-bg-border">
          <BusinessRevenueCard business={buildTotalRevenue(payload.businesses)} calendarProgressPct={payload.calendarProgressPct} />
        </div>
      </main>
    </div>
  );
}
