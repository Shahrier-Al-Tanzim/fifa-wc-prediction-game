import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getAnonName } from "@/lib/anon-utils";

export async function GET() {
  try {
    const session = await getSession();

    const users = await prisma.user.findMany({
      where: {
        isAdmin: false,
      },
      orderBy: { points: "desc" },
      select: {
        id: true,
        username: true,
        points: true,
      },
    });

    const responseLeaderboard = users.map((u) => ({
      id: u.id,
      username: session ? u.username : getAnonName(u.id),
      points: u.points,
    }));

    return NextResponse.json({ leaderboard: responseLeaderboard });
  } catch (error: any) {
    console.error("Leaderboard fetch failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}
