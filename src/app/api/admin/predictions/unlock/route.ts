import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocalDateStr } from "@/lib/date-utils";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if requester is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { isAdmin: true },
    });

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { userId, dateStr } = await req.json();

    if (!userId || !dateStr) {
      return NextResponse.json(
        { error: "userId and dateStr are required" },
        { status: 400 }
      );
    }

    const timeZone = req.headers.get("x-timezone") || "UTC";

    // 1. Find all matches on that day
    const allMatches = await prisma.match.findMany({
      select: { id: true, matchDate: true },
    });
    
    const matchIds = allMatches
      .filter((m) => getLocalDateStr(m.matchDate, timeZone) === dateStr)
      .map((m) => m.id);

    // 2. Perform deletion and recalculate user points in transaction
    await prisma.$transaction(async (tx) => {
      // Delete DayLock
      await tx.dayLock.deleteMany({
        where: {
          userId,
          dateStr,
        },
      });

      // Delete Predictions
      await tx.prediction.deleteMany({
        where: {
          userId,
          matchId: { in: matchIds },
        },
      });
    });

    // 3. Recalculate user points from scratch
    const totalPoints = await prisma.prediction.aggregate({
      where: {
        userId,
        isCorrect: true,
      },
      _sum: {
        pointsAwarded: true,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        points: totalPoints._sum.pointsAwarded || 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin unlock predictions failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unlock predictions" },
      { status: 500 }
    );
  }
}
