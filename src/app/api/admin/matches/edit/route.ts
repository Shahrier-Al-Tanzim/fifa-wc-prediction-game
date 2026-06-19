import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { isAdmin: true },
    });

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { matchId, homeTeam, awayTeam } = await req.json();

    if (!matchId || !homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: "matchId, homeTeam, and awayTeam are required fields" },
        { status: 400 }
      );
    }

    // Update the match in the database
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
      },
    });

    return NextResponse.json({ success: true, match: updatedMatch });
  } catch (error: any) {
    console.error("Admin match edit failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update match" },
      { status: 500 }
    );
  }
}
