import { NextResponse } from "next/server";
import { fetchDashboard } from "@/data/provider";
import { MONTH_ABBR } from "@/lib/googleSheets/tabResolver";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    // Only accept a known 3-letter month abbreviation — anything else falls
    // back to the live current month rather than reaching Google Sheets
    // with an arbitrary tab name.
    const month = monthParam && (MONTH_ABBR as readonly string[]).includes(monthParam) ? monthParam : undefined;

    const payload = await fetchDashboard(new Date(), month);
    return NextResponse.json(
      { payload, error: null },
      { headers: { "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ payload: null, error: message }, { status: 500 });
  }
}
