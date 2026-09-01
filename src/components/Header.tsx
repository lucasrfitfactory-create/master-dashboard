"use client";

import { useEffect, useState } from "react";
import { MONTH_ABBR, monthFullName } from "@/lib/googleSheets/tabResolver";

export function Header({
  generatedAt,
  isMock,
  selectedMonth,
  liveMonth,
  year,
  onSelectMonth,
}: {
  generatedAt: string;
  isMock: boolean;
  selectedMonth: string;
  liveMonth: string;
  year: number;
  onSelectMonth: (month: string) => void;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const updatedTime = new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });

  // Only January through the current live month — a future month has no
  // data to show yet, so it isn't offered as a choice.
  const liveIdx = MONTH_ABBR.indexOf(liveMonth);
  const availableMonths = liveIdx >= 0 ? MONTH_ABBR.slice(0, liveIdx + 1) : [liveMonth];

  return (
    <header className="flex flex-col gap-2 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center px-4 md:px-6 py-3 border-b border-bg-border bg-bg-panel shrink-0">
      <h1 className="order-1 md:order-2 md:justify-self-center text-lg md:text-2xl font-black uppercase tracking-widest text-white text-center md:text-inherit">
        Master Dashboard
      </h1>

      <div className="order-2 md:order-1 flex items-center justify-between md:justify-start gap-2 md:gap-3 flex-wrap min-w-0">
        <select
          value={selectedMonth}
          onChange={(e) => onSelectMonth(e.target.value)}
          aria-label="Select month"
          className="bg-transparent text-slate-300 text-sm md:text-xl font-semibold whitespace-nowrap border border-bg-border rounded-md px-2 py-0.5 focus:outline-none focus:border-slate-500 cursor-pointer"
        >
          {availableMonths.map((m) => (
            <option key={m} value={m} className="bg-bg-panel text-slate-100">
              {monthFullName(m).toUpperCase()} {year}
            </option>
          ))}
        </select>
        {isMock && (
          <span className="text-xs md:text-sm font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 whitespace-nowrap">
            MOCK DATA
          </span>
        )}
        <div className="text-xs md:hidden text-right ml-auto">
          <span className="text-emerald-400">Live · {updatedTime}</span>
        </div>
      </div>

      <div className="order-3 hidden md:block text-right text-xs md:text-base md:justify-self-end">
        <div className="text-emerald-400">Live · Updated {updatedTime}</div>
        <div className="text-slate-500">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Toronto" })}
        </div>
      </div>
    </header>
  );
}
