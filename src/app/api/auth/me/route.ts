import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        points: true,
      },
    });

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error("Auth status error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
