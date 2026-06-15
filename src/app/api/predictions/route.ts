import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId, predictedWinner } = await req.json();

    if (!matchId || !["HOME", "AWAY", "DRAW"].includes(predictedWinner)) {
      return NextResponse.json(
        { error: "Invalid matchId or predictedWinner selection" },
        { status: 400 }
      );
    }

    // Fetch match details to verify existence and kickoff time
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Kickoff validation: check if the match has already started/passed
    const now = new Date();
    if (now >= new Date(match.matchDate)) {
      return NextResponse.json(
        { error: "Cannot cast or change predictions after match kickoff" },
        { status: 400 }
      );
    }

    // Day lock validation: check if the user has locked predictions for this day
    const { getLocalDateStr } = await import("@/lib/date-utils");
    const timeZone = req.headers.get("x-timezone") || "UTC";
    const dateStr = getLocalDateStr(match.matchDate, timeZone);

    const isLocked = await prisma.dayLock.findUnique({
      where: {
        userId_dateStr: {
          userId: session.id,
          dateStr,
        },
      },
    });

    if (isLocked) {
      return NextResponse.json(
        { error: "Predictions for this day have already been saved and locked" },
        { status: 400 }
      );
    }

    // Upsert user prediction
    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: session.id,
          matchId,
        },
      },
      update: {
        predictedWinner,
      },
      create: {
        userId: session.id,
        matchId,
        predictedWinner,
      },
    });

    return NextResponse.json({ success: true, prediction });
  } catch (error: any) {
    console.error("Failed to submit prediction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit prediction" },
      { status: 500 }
    );
  }
}
