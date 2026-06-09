import { NextRequest, NextResponse } from "next/server";
import { submitScore } from "@/lib/multiplayer";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { playerId, gameType, value } = body as {
    playerId?: string;
    gameType?: string;
    value?: number;
  };
  if (!playerId || !gameType || typeof value !== "number") {
    return NextResponse.json(
      { error: "Missing playerId, gameType or value" },
      { status: 400 },
    );
  }

  try {
    await submitScore(playerId, gameType, value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
