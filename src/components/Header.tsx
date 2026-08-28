"use client";

import { useEffect, useState } from "react";

export function Header({ monthLabel, generatedAt, isMock }: { monthLabel: string; generatedAt: string; isMock: boolean }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const updatedTime = new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });

  return (
    <header className="flex flex-col gap-2 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center px-4 md:px-6 py-3 border-b border-bg-border bg-bg-panel shrink-0">
      <h1 className="order-1 md:order-2 md:justify-self-center text-lg md:text-2xl font-black uppercase tracking-widest text-white text-center md:text-inherit">
        Master Dashboard
      </h1>

      <div className="order-2 md:order-1 flex items-center justify-between md:justify-start gap-2 md:gap-3 flex-wrap min-w-0">
        <span className="text-slate-300 text-sm md:text-xl font-semibold whitespace-nowrap">{monthLabel.toUpperCase()}</span>
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
