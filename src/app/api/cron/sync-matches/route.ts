import { NextResponse } from "next/server";
import { syncMatches } from "@/lib/football-api";

export async function GET(req: Request) {
  try {
    // Basic verification if CRON_SECRET is set
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncMatches();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Match sync failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync matches" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
