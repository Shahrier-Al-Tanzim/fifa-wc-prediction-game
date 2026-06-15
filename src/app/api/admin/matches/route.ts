import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateMatchResult } from "@/lib/grading";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Simple role-based guard: only allow username "admin" to manage matches
    if (session.username.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { matchId, homeScore, awayScore } = await req.json();

    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: "matchId, homeScore, and awayScore are required" },
        { status: 400 }
      );
    }

    const parsedHomeScore = parseInt(homeScore);
    const parsedAwayScore = parseInt(awayScore);

    if (isNaN(parsedHomeScore) || isNaN(parsedAwayScore)) {
      return NextResponse.json(
        { error: "Scores must be numeric values" },
        { status: 400 }
      );
    }

    await updateMatchResult(matchId, parsedHomeScore, parsedAwayScore);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin match update failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update match" },
      { status: 500 }
    );
  }
}
