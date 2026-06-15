import fs from "fs";
import path from "path";
import { prisma } from "./prisma";
import fixtures from "../data/fixtures.json";

export interface SyncResult {
  source: "api" | "mock";
  updatedCount: number;
  error?: string;
}

export async function syncMatches(): Promise<SyncResult> {
  let updatedCount = 0;

  // Read results.json dynamically to bypass caching
  const resultsPath = path.resolve(process.cwd(), "src/data/results.json");
  let results: Array<{ matchNumber: number; homeScore: number | null; awayScore: number | null; status: string }> = [];
  
  if (fs.existsSync(resultsPath)) {
    try {
      results = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
    } catch (err) {
      console.error("Failed to parse results.json:", err);
    }
  }

  for (const fixture of fixtures) {
    const kickoff = new Date(fixture.kickoffUtc);
    
    // Look up if admin set result in results.json
    const resultEntry = results.find(r => r.matchNumber === fixture.matchNumber);

    let status = "SCHEDULED";
    let homeScore: number | null = null;
    let awayScore: number | null = null;
    let winner: string | null = null;

    if (resultEntry) {
      status = resultEntry.status || "SCHEDULED";
      homeScore = resultEntry.homeScore;
      awayScore = resultEntry.awayScore;

      if (status === "FINISHED" && homeScore !== null && awayScore !== null) {
        if (homeScore > awayScore) {
          winner = "HOME";
        } else if (awayScore > homeScore) {
          winner = "AWAY";
        } else {
          winner = "DRAW";
        }
      }
    }

    try {
      const dbMatch = await prisma.match.upsert({
        where: { apiMatchId: String(fixture.matchNumber) },
        update: {
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          homeScore,
          awayScore,
          status,
          matchDate: kickoff,
          winner,
        },
        create: {
          apiMatchId: String(fixture.matchNumber),
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          homeScore,
          awayScore,
          status,
          matchDate: kickoff,
          winner,
        },
      });

      // Grade predictions for this match if it is finished
      if (status === "FINISHED" && winner) {
        await prisma.result.upsert({
          where: { matchId: dbMatch.id },
          update: { winner },
          create: { matchId: dbMatch.id, winner },
        });

        const predictions = await prisma.prediction.findMany({
          where: { matchId: dbMatch.id },
        });

        for (const pred of predictions) {
          const isCorrect = pred.predictedWinner === winner;
          const pointsAwarded = isCorrect ? 1 : 0;
          await prisma.prediction.update({
            where: { id: pred.id },
            data: { isCorrect, pointsAwarded },
          });
        }
      }

      updatedCount++;
    } catch (e: any) {
      console.error(`Failed to upsert match ID ${fixture.matchNumber}:`, e.message);
    }
  }

  // Recalculate all user points
  try {
    const users = await prisma.user.findMany();
    for (const user of users) {
      const totalPoints = await prisma.prediction.aggregate({
        where: { userId: user.id },
        _sum: { pointsAwarded: true },
      });
      const points = totalPoints._sum.pointsAwarded || 0;
      await prisma.user.update({
        where: { id: user.id },
        data: { points },
      });
    }
  } catch (e: any) {
    console.error("Failed to recalculate user points:", e.message);
  }

  return { source: "mock", updatedCount };
}


