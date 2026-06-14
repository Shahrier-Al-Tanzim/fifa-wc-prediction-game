import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { syncMatches } from "@/lib/football-api";

export async function GET() {
  try {
    const session = await getSession();

    // Self-seeding: if no matches exist in the database, sync them automatically
    const count = await prisma.match.count();
    if (count === 0) {
      console.info("Database is empty. Running auto-sync/seeding...");
      await syncMatches();
    }

    // Fetch all matches
    const matches = await prisma.match.findMany({
      orderBy: { matchDate: "asc" },
    });

    // If not authenticated, return matches without user predictions
    if (!session) {
      return NextResponse.json({ matches: matches.map(m => ({ ...m, userPrediction: null })) });
    }

    // Fetch user predictions
    const predictions = await prisma.prediction.findMany({
      where: { userId: session.id },
    });

    // Map predictions to matches
    const predictionMap = new Map(predictions.map((p) => [p.matchId, p.predictedWinner]));

    const matchesWithPredictions = matches.map((match) => ({
      ...match,
      userPrediction: predictionMap.get(match.id) || null,
    }));

    return NextResponse.json({ matches: matchesWithPredictions });
  } catch (error: any) {
    console.error("Failed to fetch matches:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
