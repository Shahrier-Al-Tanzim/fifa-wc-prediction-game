import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradePredictions } from "@/lib/grading";

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

    const gradedCount = await gradePredictions();

    return NextResponse.json({ success: true, gradedCount });
  } catch (error: any) {
    console.error("Sync points failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync points" },
      { status: 500 }
    );
  }
}
