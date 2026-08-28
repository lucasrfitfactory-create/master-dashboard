"use client";

import Image from "next/image";
import { fmtCurrency, STATUS_COLORS } from "@/lib/format";
import { computePaceStatus, badgeTextForPaceStatus } from "@/lib/calculations/status";
import { BusinessRevenue } from "@/types/dashboard";
import { ProgressBar } from "./ProgressBar";

export function BusinessRevenueCard({
  business,
  calendarProgressPct,
}: {
  business: BusinessRevenue;
  calendarProgressPct: number;
}) {
  const pct =
    business.revenueMTD !== null && business.revenueGoal !== null && business.revenueGoal > 0
      ? (business.revenueMTD / business.revenueGoal) * 100
      : null;
  const status = business.connected ? computePaceStatus(pct, calendarProgressPct) : "unavailable";
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.unavailable;
  const badgeText = business.connected ? badgeTextForPaceStatus(status, pct) : "Not connected";

  return (
    <div className={`rounded-2xl border ${colors.border} bg-bg-card p-4 md:p-5 flex flex-row items-center gap-4 md:gap-6`}>
      <div className="relative flex items-center justify-center w-14 sm:w-28 md:w-40 h-12 md:h-20 shrink-0">
        {business.logoKind === "image" ? (
          // Logo files in /public/logos are pre-cropped to their visible
          // content (see the crop step noted in businesses.ts) — plain
          // object-contain fits each one's real aspect ratio into the box.
          <Image src={business.logoSrc} alt={business.logoAlt} fill sizes="160px" className="object-contain" />
        ) : (
          <span className={`text-[10px] sm:text-lg md:text-2xl font-black uppercase text-center leading-tight break-words ${business.accent}`}>
            {business.shortName}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2.5 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-slate-300 text-sm md:text-lg font-bold uppercase tracking-wide truncate">
            <span className="md:hidden">Revenue MTD — {business.shortName}</span>
            <span className="hidden md:inline">Revenue MTD — {business.name}</span>
          </h2>
          <span className={`shrink-0 text-xs md:text-sm font-bold px-3 py-1 rounded whitespace-nowrap ${colors.bg} ${colors.text}`}>
            {badgeText}
          </span>
        </div>

        <div className="flex items-baseline gap-2 md:gap-3 min-w-0 flex-wrap">
          <span className="text-3xl md:text-5xl font-black text-white leading-none tracking-tight truncate">
            {business.connected ? fmtCurrency(business.revenueMTD) : "—"}
          </span>
          {business.connected && (
            <span className="text-lg md:text-2xl text-slate-400 font-semibold shrink-0"> / {fmtCurrency(business.revenueGoal)}</span>
          )}
        </div>

        {business.connected ? (
          <div className="flex flex-col gap-1.5">
            <ProgressBar currentPct={pct} expectedPct={calendarProgressPct} status={status} height="h-3 md:h-4" />
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-slate-300 font-semibold">{pct !== null ? `${pct.toFixed(1)}% achieved` : "—"}</span>
              <span className="text-slate-400">{calendarProgressPct.toFixed(1)}% of month elapsed</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">{business.warning || "Waiting on spreadsheet access."}</p>
        )}
      </div>
    </div>
  );
}
