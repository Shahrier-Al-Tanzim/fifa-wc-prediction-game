import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { syncMatches } from "@/lib/football-api";
import { getLocalDateStr } from "@/lib/date-utils";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const timeZone = req.headers.get("x-timezone") || "UTC";

    // Self-seeding: if no matches exist in the database, sync them automatically
    const count = await prisma.match.count();
    if (count === 0) {
      console.info("Database is empty. Running auto-sync/seeding...");
      await syncMatches();
    }

    // Fetch all matches with results
    const matches = await prisma.match.findMany({
      orderBy: { matchDate: "asc" },
      include: {
        result: true,
      },
    });

    // Fetch all predictions with user info
    const allPredictions = await prisma.prediction.findMany({
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    // Group predictions by matchId
    const predictionsByMatch = new Map<string, Array<{ userId: string; username: string; prediction: string }>>();
    allPredictions.forEach((p) => {
      const list = predictionsByMatch.get(p.matchId) || [];
      list.push({ userId: p.userId, username: p.user.username, prediction: p.predictedWinner });
      predictionsByMatch.set(p.matchId, list);
    });

    const now = new Date();

    if (!session) {
      const matchesWithOthers = matches.map((match) => {
        const isKickoffPassed = now >= new Date(match.matchDate);
        const others = predictionsByMatch.get(match.id) || [];
        // Extract plain match fields to avoid sending relation objects
        const { result, ...matchData } = match;
        return {
          ...matchData,
          winner: result ? result.winner : null,
          status: result ? "FINISHED" : "SCHEDULED",
          homeScore: result ? matchData.homeScore : null,
          awayScore: result ? matchData.awayScore : null,
          userPrediction: null,
          otherPredictions: isKickoffPassed ? others : [],
        };
      });

      return NextResponse.json({
        matches: matchesWithOthers,
        lockedDates: [],
      });
    }

    // Fetch user day locks
    const dayLocks = await prisma.dayLock.findMany({
      where: { userId: session.id },
      select: { dateStr: true },
    });
    const lockedDates = dayLocks.map((d) => d.dateStr);

    const matchesWithPredictions = matches.map((match) => {
      const localDateStr = getLocalDateStr(match.matchDate, timeZone);
      const isDayLocked = lockedDates.includes(localDateStr);
      const isKickoffPassed = now >= new Date(match.matchDate);

      const allPredsForMatch = predictionsByMatch.get(match.id) || [];

      // Filter predictions:
      // Current user can see other users' predictions ONLY IF they have locked this day OR if the match has kicked off.
      // Filter out the current user's prediction from otherPredictions to avoid duplication.
      const showOthers = isDayLocked || isKickoffPassed;

      const otherPredictions = showOthers
        ? allPredsForMatch
            .filter((p) => p.userId !== session.id)
            .map((p) => ({ username: p.username, prediction: p.prediction }))
        : [];

      // Fetch user's own prediction
      const userPred = allPredsForMatch.find((p) => p.userId === session.id);

      const { result, ...matchData } = match;
      return {
        ...matchData,
        winner: result ? result.winner : null,
        status: result ? "FINISHED" : "SCHEDULED",
        homeScore: result ? matchData.homeScore : null,
        awayScore: result ? matchData.awayScore : null,
        userPrediction: userPred ? userPred.prediction : null,
        otherPredictions,
      };
    });

    return NextResponse.json({
      matches: matchesWithPredictions,
      lockedDates,
    });
  } catch (error: any) {
    console.error("Failed to fetch matches:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
