import { NextResponse } from "next/server";
import { joinMatch, type GameType } from "@/lib/multiplayer";

export async function POST(request: Request) {
  const body = await request.json();
  const { gameType, playerId } = body as {
    gameType?: string;
    playerId?: string;
  };

  if (
    !playerId ||
    !gameType ||
    (gameType !== "connect4" && gameType !== "tictactoe")
  ) {
    return NextResponse.json(
      { error: "Missing or invalid playerId/gameType" },
      { status: 400 },
    );
  }

  const game = await joinMatch(gameType as GameType, playerId);
  return NextResponse.json({
    gameId: game.id,
    game,
    role:
      game.host.id === playerId ? game.host.role : (game.guest?.role ?? null),
  });
}
