import { NextRequest, NextResponse } from "next/server";
import { joinByInvite } from "@/lib/multiplayer";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, playerId } = body as { code?: string; playerId?: string };
  if (!code || !playerId) {
    return NextResponse.json(
      { error: "Missing code or playerId" },
      { status: 400 },
    );
  }

  try {
    const match = await joinByInvite(code, playerId);
    return NextResponse.json({ game: match });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
