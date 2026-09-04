import { BUSINESSES, BusinessConfig } from "@/config/businesses";
import { batchReadColumnRanges, batchReadValues, listTabNames } from "@/lib/googleSheets/client";
import { currentMonthTabName, MONTH_ABBR, monthFullName, resolveTab, titleCaseMonth, twoDigitYear } from "@/lib/googleSheets/tabResolver";
import { parseCurrency } from "@/lib/spreadsheetParser/valueParsing";
import { BusinessRevenue, DashboardPayload, SocialStats } from "@/types/dashboard";
import socialStatsData from "@/config/socialStats.json";

const TIMEZONE = process.env.BUSINESS_TIMEZONE || "America/Toronto";

function calendarProgressPct(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value); // 1-12
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return (day / daysInMonth) * 100;
}

function daysInMonthForAbbr(monthAbbr: string, year: number): number {
  const idx = MONTH_ABBR.indexOf(monthAbbr); // 0-based
  return new Date(Date.UTC(year, idx + 1, 0)).getUTCDate();
}

function parseCellRef(cell: string): { col: string; row: number } {
  const match = cell.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) throw new Error(`Invalid cell reference: "${cell}"`);
  return { col: match[1].toUpperCase(), row: Number(match[2]) };
}

const MOCK_REVENUE: Record<string, { revenueMTD: number; revenueGoal: number }> = {
  "ff-downtown": { revenueMTD: 72394, revenueGoal: 90000 },
  "ff-midtown": { revenueMTD: 55064, revenueGoal: 55000 },
  "refined-reformer": { revenueMTD: 38210, revenueGoal: 52000 },
  "nrg-haus": { revenueMTD: 0, revenueGoal: 0 },
};

// Builds this business's tab name for a given month/year using its own
// naming convention (tabPrefix/tabCase/tabYearSuffix), the same formula
// used for the live month — so picking a past month from the selector
// resolves correctly per-business, not just for the "AUG" convention.
function tabNameForMonth(business: BusinessConfig, monthAbbr: string, year: number): string {
  const formattedMonth = business.tabCase === "title" ? titleCaseMonth(monthAbbr) : monthAbbr;
  const yearSuffix = business.tabYearSuffix === "YY" ? ` ${twoDigitYear(year)}` : "";
  return `${business.tabPrefix ?? ""}${formattedMonth}${yearSuffix}`;
}

// The TOTALS row's exact row number shifts with days-in-month (28-31 days),
// so business.revenueCell is only a reliable anchor for a 31-day month.
// Scans the label column in a small window ending at the anchor row for a
// cell reading "TOTALS", and reads the revenue value from whichever row
// actually has it — self-correcting for any month length. Falls back to
// the literal anchor cell (previous hardcoded behavior) if the label can't
// be confirmed, with a warning only when that fallback is actually risky
// (i.e. the month doesn't have 31 days, so the anchor row may be wrong).
async function readRevenueForTab(
  spreadsheetId: string,
  tab: string,
  business: BusinessConfig,
  monthAbbr: string,
  year: number
): Promise<{ value: string | undefined; warning?: string }> {
  const { col: revCol, row: anchorRow } = parseCellRef(business.revenueCell!);
  const labelCol = business.revenueLabelColumn ?? "B";
  const windowStart = Math.max(1, anchorRow - 3);

  const [labelCells, valueCells] = await batchReadColumnRanges(spreadsheetId, [
    `${tab}!${labelCol}${windowStart}:${labelCol}${anchorRow}`,
    `${tab}!${revCol}${windowStart}:${revCol}${anchorRow}`,
  ]);

  const offset = labelCells.findIndex((c) => (c ?? "").trim().toUpperCase() === "TOTALS");
  if (offset >= 0) {
    return { value: valueCells[offset] };
  }

  const anchorOffset = anchorRow - windowStart;
  const days = daysInMonthForAbbr(monthAbbr, year);
  const warning =
    days !== 31
      ? `Could not confirm the TOTALS row for "${tab}" (expected near ${revCol}${anchorRow}) — showing that row directly, which may be off since this month has ${days} days.`
      : undefined;
  return { value: valueCells[anchorOffset], warning };
}

async function fetchLiveBusinessRevenue(business: BusinessConfig, monthAbbr: string, year: number): Promise<BusinessRevenue> {
  const base = {
    id: business.id,
    name: business.name,
    shortName: business.shortName,
    logoSrc: business.logoSrc,
    logoAlt: business.logoAlt,
    logoKind: business.logoKind,
    accent: business.accent,
    href: business.href ?? null,
  };

  const spreadsheetId = process.env[business.spreadsheetIdEnv];
  if (!spreadsheetId || !business.goalCell || !business.revenueCell) {
    return {
      ...base,
      connected: false,
      revenueMTD: null,
      revenueGoal: null,
      resolvedTab: null,
      warning: "Not connected yet — spreadsheet ID or cell mapping missing.",
    };
  }

  const defaultTab = tabNameForMonth(business, monthAbbr, year);
  const requestedTab = business.tabOverrideEnv && process.env[business.tabOverrideEnv]
    ? (process.env[business.tabOverrideEnv] as string)
    : defaultTab;

  const attemptRead = async (tab: string) => {
    const [[goalRaw], revenueResult] = await Promise.all([
      batchReadValues(spreadsheetId, [`${tab}!${business.goalCell}`]),
      readRevenueForTab(spreadsheetId, tab, business, monthAbbr, year),
    ]);
    return { goalRaw, revenueResult };
  };

  try {
    let tab = requestedTab;
    let tabWarning: string | undefined;
    let result;
    try {
      result = await attemptRead(tab);
    } catch {
      // Requested tab likely doesn't exist yet — resolve against the real tab list.
      const availableTabs = await listTabNames(spreadsheetId);
      const resolution = resolveTab(requestedTab, availableTabs);
      tab = resolution.resolvedTab;
      tabWarning = resolution.warning;
      result = await attemptRead(tab);
    }

    const goal = parseCurrency(result.goalRaw);
    const revenue = parseCurrency(result.revenueResult.value);

    return {
      ...base,
      connected: true,
      revenueMTD: revenue.value,
      revenueGoal: goal.value,
      resolvedTab: tab,
      warning: tabWarning || result.revenueResult.warning || goal.warning || revenue.warning || null,
    };
  } catch (err) {
    return {
      ...base,
      connected: false,
      revenueMTD: null,
      revenueGoal: null,
      resolvedTab: null,
      warning: err instanceof Error ? err.message : "Failed to read spreadsheet.",
    };
  }
}

function mockBusinessRevenue(business: BusinessConfig): BusinessRevenue {
  const mock = MOCK_REVENUE[business.id];
  const connected = Boolean(mock && mock.revenueGoal > 0);
  return {
    id: business.id,
    name: business.name,
    shortName: business.shortName,
    logoSrc: business.logoSrc,
    logoAlt: business.logoAlt,
    logoKind: business.logoKind,
    accent: business.accent,
    href: business.href ?? null,
    connected,
    revenueMTD: connected ? mock.revenueMTD : null,
    revenueGoal: connected ? mock.revenueGoal : null,
    resolvedTab: connected ? "MOCK" : null,
    warning: connected ? null : "Not connected yet — spreadsheet ID or cell mapping missing.",
  };
}

// overrideMonth: a 3-letter month abbreviation (e.g. "JUL") to view a past
// month instead of the live current one, from the month selector. A closed
// past month has nothing left to "pace" against, so calendarProgressPct is
// forced to 100 — see RevenueHero-equivalent status math in
// computePaceStatus, which otherwise compares progress to elapsed-time.
export async function fetchDashboard(now: Date, overrideMonth?: string): Promise<DashboardPayload> {
  const isMock = (process.env.DASHBOARD_DATA_SOURCE || "mock") === "mock";
  const live = currentMonthTabName(now, TIMEZONE);
  const monthAbbr = overrideMonth ?? live.tab;
  const isHistorical = monthAbbr !== live.tab;

  const businesses = isMock
    ? BUSINESSES.map(mockBusinessRevenue)
    : await Promise.all(BUSINESSES.map((b) => fetchLiveBusinessRevenue(b, monthAbbr, live.year)));

  return {
    generatedAt: now.toISOString(),
    calendarProgressPct: isHistorical ? 100 : calendarProgressPct(now, TIMEZONE),
    monthLabel: `${monthFullName(monthAbbr)} ${live.year}`,
    businesses,
    socialStats: socialStatsData.stats as Record<string, SocialStats | undefined>,
    socialStatsUpdatedAt: socialStatsData.generatedAt,
    selectedMonth: monthAbbr,
    liveMonth: live.tab,
    year: live.year,
    isHistorical,
  };
}
