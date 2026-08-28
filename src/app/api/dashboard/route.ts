import { NextResponse } from "next/server";
import { fetchDashboard } from "@/data/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await fetchDashboard(new Date());
    return NextResponse.json(
      { payload, error: null },
      { headers: { "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ payload: null, error: message }, { status: 500 });
  }
}
