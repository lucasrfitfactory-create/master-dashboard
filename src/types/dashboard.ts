export type MetricStatus = "ahead" | "on-track" | "achieved" | "at-risk" | "off-track" | "unavailable";

export type BusinessRevenue = {
  id: string;
  name: string;
  shortName: string;
  logoSrc: string;
  logoAlt: string;
  logoKind: "image" | "wordmark";
  accent: string;
  connected: boolean;
  revenueMTD: number | null;
  revenueGoal: number | null;
  resolvedTab: string | null;
  warning: string | null;
};

export type DashboardPayload = {
  generatedAt: string;
  calendarProgressPct: number;
  monthLabel: string;
  businesses: BusinessRevenue[];
};
