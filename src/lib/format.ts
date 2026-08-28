export function fmtCurrency(n: number | null, opts: { maximumFractionDigits?: number } = {}): string {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: opts.maximumFractionDigits ?? 0,
  });
}

export function fmtPercent(n: number | null, digits = 1): string {
  if (n === null || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export const STATUS_COLORS: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  ahead: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  "on-track": { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  achieved: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  "at-risk": { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-400" },
  "off-track": { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", dot: "bg-red-400" },
  unavailable: { text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", dot: "bg-slate-400" },
};
