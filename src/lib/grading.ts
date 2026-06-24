import { prisma } from "./prisma";

export async function gradePredictions(): Promise<number> {
  // 1. Fetch all matches that have a Result
  const completedMatches = await prisma.match.findMany({
    where: {
      result: { isNot: null },
    },
    include: {
      result: true,
    },
  });

  const completedMatchIds = completedMatches.map((m) => m.id);

  // 2. Fetch all predictions for these completed matches
  const predictionsToGrade = await prisma.prediction.findMany({
    where: {
      matchId: { in: completedMatchIds },
    },
  });

  let gradedCount = 0;

  for (const prediction of predictionsToGrade) {
    const match = completedMatches.find((m) => m.id === prediction.matchId);
    const winner = match?.result?.winner;
    if (!winner) continue;

    const isCorrect = prediction.predictedWinner === winner;
    const pointsAwarded = isCorrect ? 1 : 0;

    // Only update if the status changed or was previously ungraded
    if (prediction.isCorrect !== isCorrect || prediction.pointsAwarded !== pointsAwarded) {
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          isCorrect,
          pointsAwarded,
        },
      });
      gradedCount++;
    }
  }

  // 3. Reset predictions back to null if the match result was deleted
  const predictionsToReset = await prisma.prediction.findMany({
    where: {
      isCorrect: { not: null },
      match: {
        result: null,
      },
    },
  });

  for (const prediction of predictionsToReset) {
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        isCorrect: null,
        pointsAwarded: 0,
      },
    });
    gradedCount++;
  }

  // 2. Recalculate all users' points from scratch to ensure absolute correctness of the leaderboard
  const allUsers = await prisma.user.findMany({
    include: {
      _count: {
        select: { predictions: true }
      }
    }
  });
  for (const user of allUsers) {
    // If the user has never made any predictions, preserve their points (e.g. manual seed/starting points)
    if (user._count.predictions === 0) continue;

    const totalPoints = await prisma.prediction.aggregate({
      where: {
        userId: user.id,
        isCorrect: true,
      },
      _sum: {
        pointsAwarded: true,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        points: totalPoints._sum.pointsAwarded || 0,
      },
    });
  }

  return gradedCount;
}

export async function updateMatchResult(matchId: string, homeScore: number, awayScore: number): Promise<boolean> {
  // Determine winner: HOME, AWAY, or DRAW
  let winner = "DRAW";
  if (homeScore > awayScore) {
    winner = "HOME";
  } else if (awayScore > homeScore) {
    winner = "AWAY";
  }

  // Update the match to FINISHED with the score
  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore,
      awayScore,
      status: "FINISHED",
      winner,
    },
  });

  // Upsert into Result table
  await prisma.result.upsert({
    where: { matchId },
    update: { winner },
    create: { matchId, winner },
  });

  // Run the grading process to update predictions & user points
  await gradePredictions();

  return true;
}
