import { MetricStatus } from "@/types/dashboard";

// Pace-adjusted status: compares current progress to expected-by-today
// progress (calendar elapsed %), not raw percent-to-target. Being at 62% of
// a goal that's only 40% "due" by today is ahead of pace, not behind.
export function computePaceStatus(pctAchieved: number | null, calendarProgressPct: number): MetricStatus {
  if (pctAchieved === null) return "unavailable";
  if (pctAchieved >= 100) return "achieved";
  const gapPoints = pctAchieved - calendarProgressPct;
  if (gapPoints >= 0) return "ahead";
  if (gapPoints >= -10) return "at-risk";
  return "off-track";
}

export function badgeTextForPaceStatus(status: MetricStatus, pctAchieved: number | null): string {
  if (status === "unavailable") return "No data";
  if (status === "achieved") return "Target achieved";
  if (status === "ahead") return "Ahead of calendar pace";
  return "Behind calendar pace";
}
