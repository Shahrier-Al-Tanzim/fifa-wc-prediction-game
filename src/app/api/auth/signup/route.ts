import { NextResponse } from "next/server";

export async function POST(req: Request) {
  return NextResponse.json(
    { error: "Registrations are currently closed." },
    { status: 403 }
  );
}
