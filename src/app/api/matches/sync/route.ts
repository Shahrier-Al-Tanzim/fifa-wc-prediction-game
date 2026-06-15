import { NextResponse } from "next/server";
import { syncMatches } from "@/lib/football-api";
import { getSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
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
