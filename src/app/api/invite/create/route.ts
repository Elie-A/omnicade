import { NextRequest, NextResponse } from "next/server";
import { createInvite } from "@/lib/multiplayer";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { gameType, playerId } = body as {
    gameType?: string;
    playerId?: string;
  };
  if (!playerId || !gameType) {
    return NextResponse.json(
      { error: "Missing playerId or gameType" },
      { status: 400 },
    );
  }

  try {
    const result = await createInvite(gameType as any, playerId);
    return NextResponse.json({ code: result.code, game: result.match });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
