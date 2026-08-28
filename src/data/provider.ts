import { BUSINESSES, BusinessConfig } from "@/config/businesses";
import { batchReadValues, listTabNames } from "@/lib/googleSheets/client";
import { currentMonthTabName, resolveTab } from "@/lib/googleSheets/tabResolver";
import { parseCurrency } from "@/lib/spreadsheetParser/valueParsing";
import { BusinessRevenue, DashboardPayload } from "@/types/dashboard";

const TIMEZONE = process.env.BUSINESS_TIMEZONE || "America/Toronto";

function calendarProgressPct(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value); // 1-12
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return (day / daysInMonth) * 100;
}

function monthLabel(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, month: "long", year: "numeric" }).format(now);
}

const MOCK_REVENUE: Record<string, { revenueMTD: number; revenueGoal: number }> = {
  "ff-downtown": { revenueMTD: 72394, revenueGoal: 90000 },
  "ff-midtown": { revenueMTD: 55064, revenueGoal: 55000 },
  "refined-reformer": { revenueMTD: 38210, revenueGoal: 52000 },
  "nrg-haus": { revenueMTD: 0, revenueGoal: 0 },
};

async function fetchLiveBusinessRevenue(business: BusinessConfig, now: Date): Promise<BusinessRevenue> {
  const base = {
    id: business.id,
    name: business.name,
    shortName: business.shortName,
    logoSrc: business.logoSrc,
    logoAlt: business.logoAlt,
    logoKind: business.logoKind,
    accent: business.accent,
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

  const requestedTab = business.tabOverrideEnv && process.env[business.tabOverrideEnv]
    ? (process.env[business.tabOverrideEnv] as string)
    : currentMonthTabName(now, TIMEZONE).tab;

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
    connected,
    revenueMTD: connected ? mock.revenueMTD : null,
    revenueGoal: connected ? mock.revenueGoal : null,
    resolvedTab: connected ? "MOCK" : null,
    warning: connected ? null : "Not connected yet — spreadsheet ID or cell mapping missing.",
  };
}

export async function fetchDashboard(now: Date): Promise<DashboardPayload> {
  const isMock = (process.env.DASHBOARD_DATA_SOURCE || "mock") === "mock";

  const businesses = isMock
    ? BUSINESSES.map(mockBusinessRevenue)
    : await Promise.all(BUSINESSES.map((b) => fetchLiveBusinessRevenue(b, now)));

  return {
    generatedAt: now.toISOString(),
    calendarProgressPct: calendarProgressPct(now, TIMEZONE),
    monthLabel: monthLabel(now, TIMEZONE),
    businesses,
  };
}
