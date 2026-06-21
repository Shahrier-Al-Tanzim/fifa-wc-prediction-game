import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const { userId, points } = await req.json();

    if (!userId || typeof points !== "number") {
      return NextResponse.json(
        { error: "userId and points (number) are required" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { points },
    });

    return NextResponse.json({
      success: true,
      user: { id: updatedUser.id, username: updatedUser.username, points: updatedUser.points },
    });
  } catch (error: any) {
    console.error("Failed to update user points:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update points" },
      { status: 500 }
    );
  }
}
