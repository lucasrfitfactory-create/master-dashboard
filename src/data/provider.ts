import { BUSINESSES, BusinessConfig } from "@/config/businesses";
import { batchReadValues, listTabNames } from "@/lib/googleSheets/client";
import { currentMonthTabName, monthFullName, resolveTab, titleCaseMonth, twoDigitYear } from "@/lib/googleSheets/tabResolver";
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

  const readCells = async (tab: string) => {
    const [goalRaw, revenueRaw] = await batchReadValues(spreadsheetId, [
      `${tab}!${business.goalCell}`,
      `${tab}!${business.revenueCell}`,
    ]);
    return { goalRaw, revenueRaw };
  };

  try {
    let tab = requestedTab;
    let warning: string | undefined;
    let cells;
    try {
      cells = await readCells(tab);
    } catch {
      // Requested tab likely doesn't exist yet — resolve against the real tab list.
      const availableTabs = await listTabNames(spreadsheetId);
      const resolution = resolveTab(requestedTab, availableTabs);
      tab = resolution.resolvedTab;
      warning = resolution.warning;
      cells = await readCells(tab);
    }

    const goal = parseCurrency(cells.goalRaw);
    const revenue = parseCurrency(cells.revenueRaw);

    return {
      ...base,
      connected: true,
      revenueMTD: revenue.value,
      revenueGoal: goal.value,
      resolvedTab: tab,
      warning: warning || goal.warning || revenue.warning || null,
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
