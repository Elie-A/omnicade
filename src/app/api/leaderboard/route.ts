import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/multiplayer";

export async function GET() {
  const data = await getLeaderboard();
  return NextResponse.json(data);
}
