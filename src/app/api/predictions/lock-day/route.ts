import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface InputPrediction {
  matchId: string;
  predictedWinner: "HOME" | "AWAY" | "DRAW";
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dateStr, predictions } = await req.json();

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { error: "Invalid dateStr. Format must be YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (!predictions || !Array.isArray(predictions)) {
      return NextResponse.json(
        { error: "predictions array is required" },
        { status: 400 }
      );
    }

    const matchIds = predictions.map((p: InputPrediction) => p.matchId);

    // Fetch the target matches to verify existence and kickoff times
    const matches = await prisma.match.findMany({
      where: {
        id: {
          in: matchIds,
        },
      },
    });

    if (matches.length < matchIds.length) {
      return NextResponse.json(
        { error: "One or more matchIds are invalid" },
        { status: 400 }
      );
    }

    // Verify none of the matches have kicked off
    const now = new Date();
    const hasKickedOff = matches.some((m) => now >= new Date(m.matchDate));

    if (hasKickedOff) {
      return NextResponse.json(
        { error: "Cannot save: One or more matches on this day have already kicked off." },
        { status: 400 }
      );
    }

    // Save predictions and lock the day in a single transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create/Update user predictions
      for (const pred of predictions) {
        await tx.prediction.upsert({
          where: {
            userId_matchId: {
              userId: session.id,
              matchId: pred.matchId,
            },
          },
          update: {
            predictedWinner: pred.predictedWinner,
          },
          create: {
            userId: session.id,
            matchId: pred.matchId,
            predictedWinner: pred.predictedWinner,
          },
        });
      }

      // 2. Lock the day
      await tx.dayLock.upsert({
        where: {
          userId_dateStr: {
            userId: session.id,
            dateStr,
          },
        },
        update: {},
        create: {
          userId: session.id,
          dateStr,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save and lock predictions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save and lock predictions" },
      { status: 500 }
    );
  }
}
