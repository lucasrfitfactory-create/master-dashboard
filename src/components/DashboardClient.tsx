"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardPayload } from "@/types/dashboard";
import { Header } from "./Header";
import { BusinessRevenueCard } from "./BusinessRevenueCard";

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
      </main>
    </div>
  );
}
