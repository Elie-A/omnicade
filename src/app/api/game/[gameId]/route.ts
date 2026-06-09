import { NextRequest, NextResponse } from "next/server";
import { getMatch, submitMove } from "@/lib/multiplayer";

export async function GET(request: NextRequest, context: any) {
  const params = await context.params;
  const playerId =
    new URL(request.url).searchParams.get("playerId") ?? undefined;
  const game = await getMatch(params.gameId);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({
    game,
    yourRole:
      playerId === game.host.id
        ? game.host.role
        : playerId === game.guest?.id
          ? (game.guest?.role ?? null)
          : null,
  });
}

export async function POST(request: NextRequest, context: any) {
  const params = await context.params;
  const body = await request.json();
  const { playerId, payload } = body as {
    playerId?: string;
    payload?: { column?: number; index?: number };
  };

  if (!playerId || !payload) {
    return NextResponse.json(
      { error: "Missing playerId or payload" },
      { status: 400 },
    );
  }

  try {
    const game = await submitMove(params.gameId, playerId, payload);
    return NextResponse.json({ game });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
