import { fetchDashboard } from "@/data/provider";
import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const payload = await fetchDashboard(new Date());
  return <DashboardClient initial={{ payload, error: null }} />;
}
