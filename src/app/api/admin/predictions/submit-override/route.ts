import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify requesting user is admin
    const requester = await prisma.user.findUnique({
      where: { id: session.id },
      select: { isAdmin: true },
    });

    if (!requester || !requester.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { userId, matchId, predictedWinner } = await req.json();

    if (!userId || !matchId || !predictedWinner) {
      return NextResponse.json(
        { error: "userId, matchId, and predictedWinner are required" },
        { status: 400 }
      );
    }

    if (!["HOME", "AWAY", "DRAW"].includes(predictedWinner)) {
      return NextResponse.json(
        { error: "predictedWinner must be HOME, AWAY, or DRAW" },
        { status: 400 }
      );
    }

    // 1. Fetch match to check if it's already graded/finished
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { status: true, winner: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const isGraded = match.status === "FINISHED" && match.winner !== null;
    const isCorrect = isGraded ? predictedWinner === match.winner : null;
    const pointsAwarded = isGraded && isCorrect ? 1 : 0;

    // 2. Perform prediction upsert and user points update in a transaction
    await prisma.$transaction(async (tx) => {
      // Upsert the prediction bypassing regular kickoff/lock limits
      await tx.prediction.upsert({
        where: {
          userId_matchId: {
            userId,
            matchId,
          },
        },
        update: {
          predictedWinner,
          isCorrect,
          pointsAwarded,
        },
        create: {
          userId,
          matchId,
          predictedWinner,
          isCorrect,
          pointsAwarded,
        },
      });

      // Recalculate user points
      const totalPoints = await tx.prediction.aggregate({
        where: {
          userId,
          isCorrect: true,
        },
        _sum: {
          pointsAwarded: true,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          points: totalPoints._sum.pointsAwarded || 0,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin submit override failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to override prediction" },
      { status: 500 }
    );
  }
}
