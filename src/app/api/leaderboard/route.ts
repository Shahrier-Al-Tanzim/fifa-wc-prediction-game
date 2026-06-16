import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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

    return NextResponse.json({ leaderboard: users });
  } catch (error: any) {
    console.error("Leaderboard fetch failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}
