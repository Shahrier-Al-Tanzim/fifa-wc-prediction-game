// import { NextResponse } from "next/server";
// import { getSession } from "@/lib/auth";
// import { prisma } from "@/lib/prisma";
// import { getLocalDateStr } from "@/lib/date-utils";

// export async function POST(req: Request) {
//   try {
//     const session = await getSession();
//     if (!session) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const dbUser = await prisma.user.findUnique({
//       where: { id: session.id },
//       select: { isAdmin: true },
//     });

//     if (!dbUser || !dbUser.isAdmin) {
//       return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
//     }

//     const { dateStr, results } = await req.json();

//     if (!dateStr || !results || !Array.isArray(results)) {
//       return NextResponse.json(
//         { error: "dateStr and results array are required" },
//         { status: 400 }
//       );
//     }

//     const matchIds = results.map((r) => r.matchId);

//     // Fetch matches
//     const matches = await prisma.match.findMany({
//       where: { id: { in: matchIds } },
//     });

//     if (matches.length < matchIds.length) {
//       return NextResponse.json({ error: "One or more matchIds are invalid" }, { status: 400 });
//     }

//     // Verify all matches on this day have kicked off
//     const now = new Date();
//     const timeZone = req.headers.get("x-timezone") || "UTC";

//     // Validate matches actually belong to the targeted day
//     for (const match of matches) {
//       const matchLocalDate = getLocalDateStr(match.matchDate, timeZone);
//       if (matchLocalDate !== dateStr) {
//         return NextResponse.json(
//           { error: `Match ${match.homeTeam} vs ${match.awayTeam} does not belong to ${dateStr}` },
//           { status: 400 }
//         );
//       }
//     }

//     // Save winners using a transaction
//     await prisma.$transaction(async (tx) => {
//       for (const res of results) {
//         let homeScore = 0;
//         let awayScore = 0;
//         if (res.winner === "HOME") {
//           homeScore = 1;
//           awayScore = 0;
//         } else if (res.winner === "AWAY") {
//           homeScore = 0;
//           awayScore = 1;
//         }

//         // Upsert into Result table
//         await tx.result.upsert({
//           where: { matchId: res.matchId },
//           update: { winner: res.winner },
//           create: { matchId: res.matchId, winner: res.winner },
//         });

//         await tx.match.update({
//           where: { id: res.matchId },
//           data: {
//             homeScore,
//             awayScore,
//             status: "FINISHED",
//             winner: res.winner,
//           },
//         });
//       }
//     });

//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     console.error("Admin batch result save failed:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to save results" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocalDateStr } from "@/lib/date-utils";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { isAdmin: true },
    });

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { dateStr, results } = await req.json();

    if (!dateStr || !results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: "dateStr and results array are required" },
        { status: 400 }
      );
    }

    const matchIds = results.map((r: any) => r.matchId);

    // Fetch matches
    const matches = await prisma.match.findMany({
      where: { id: { in: matchIds } },
    });

    if (matches.length < matchIds.length) {
      return NextResponse.json({ error: "One or more matchIds are invalid" }, { status: 400 });
    }

    // Verify all matches on this day have kicked off
    const now = new Date();
    const timeZone = req.headers.get("x-timezone") || "UTC";

    // Validate matches actually belong to the targeted day
    for (const match of matches) {
      const matchLocalDate = getLocalDateStr(match.matchDate, timeZone);
      if (matchLocalDate !== dateStr) {
        return NextResponse.json(
          { error: `Match ${match.homeTeam} vs ${match.awayTeam} does not belong to ${dateStr}` },
          { status: 400 }
        );
      }
    }

    // Save winners using a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const res of results) {
        const homeScore = typeof res.homeScore === "number" ? res.homeScore : (res.winner === "HOME" ? 1 : 0);
        const awayScore = typeof res.awayScore === "number" ? res.awayScore : (res.winner === "AWAY" ? 1 : 0);

        // Upsert into Result table
        await tx.result.upsert({
          where: { matchId: res.matchId },
          update: { winner: res.winner },
          create: { matchId: res.matchId, winner: res.winner },
        });

        await tx.match.update({
          where: { id: res.matchId },
          data: {
            homeScore,
            awayScore,
            status: "FINISHED",
            winner: res.winner,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin batch result save failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save results" },
      { status: 500 }
    );
  }
}