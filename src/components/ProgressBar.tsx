"use client";

import { STATUS_COLORS } from "@/lib/format";
import { MetricStatus } from "@/types/dashboard";

export function ProgressBar({
  currentPct,
  expectedPct,
  status,
  height = "h-4",
}: {
  currentPct: number | null;
  expectedPct: number | null;
  status: MetricStatus;
  height?: string;
}) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.unavailable;
  const barWidth = currentPct === null ? 0 : Math.min(currentPct, 100);

  return (
    <div className="relative w-full">
      <div className={`relative w-full ${height} rounded-full bg-white/5 border border-white/10 overflow-visible`}>
        <div className={`${height} rounded-full ${colors.dot} transition-all duration-700`} style={{ width: `${barWidth}%` }} />
        {expectedPct !== null && expectedPct > 0 && expectedPct <= 100 && (
          <div
            className="absolute top-[-4px] bottom-[-4px] w-[2px] bg-white/70"
            style={{ left: `${Math.min(expectedPct, 100)}%` }}
            title={`Expected progress by today: ${expectedPct.toFixed(1)}%`}
          />
        )}
        <div className="absolute top-[-4px] bottom-[-4px] w-[2px] bg-white/30" style={{ left: "100%" }} title="Goal" />
      </div>
    </div>
  );
}
