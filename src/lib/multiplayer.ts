import { promises as fs } from "fs";
import { join } from "path";

export type GameType = "connect4" | "tictactoe";
export type Connect4Cell = "R" | "Y" | null;
export type TicTacToeCell = "X" | "O" | null;
export type PlayerRole = "R" | "Y" | "X" | "O";
export type MatchStatus = "waiting" | "playing" | "completed";

const SERVER_STATE_PATH = join(process.cwd(), "data", "server-state.json");

export interface MatchResult {
  gameId: string;
  gameType: GameType;
  winner: PlayerRole | null;
  winnerPlayerId: string | null;
  finishedAt: string;
}

export interface BaseGameState {
  id: string;
  gameType: GameType;
  host: {
    id: string;
    role: PlayerRole;
  };
  guest?: {
    id: string;
    role: PlayerRole;
  };
  turn: PlayerRole;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
  winner: PlayerRole | null;
  history: unknown[];
}

export interface Connect4GameState extends BaseGameState {
  gameType: "connect4";
  board: Connect4Cell[][];
}

export interface TicTacToeGameState extends BaseGameState {
  gameType: "tictactoe";
  board: TicTacToeCell[];
}

export type GameState = Connect4GameState | TicTacToeGameState;

interface ServerState {
  matches: GameState[];
  results: MatchResult[];
  invites?: { code: string; matchId: string; expiresAt: string }[];
  scores?: {
    id: string;
    playerId: string;
    gameType: string;
    value: number;
    at: string;
  }[];
}

function nowISOString() {
  return new Date().toISOString();
}

async function readServerState(): Promise<ServerState> {
  // Try configured Redis (Upstash) client first using any supported env var names
  try {
    const client = await getRedisClient();
    if (client) {
      try {
        const raw = await client.get("omnicade:server-state");
        if (raw) {
          return typeof raw === "string"
            ? JSON.parse(raw)
            : (raw as ServerState);
        }
      } catch {
        // continue to filesystem fallback
      }
    }
  } catch {}

  try {
    const contents = await fs.readFile(SERVER_STATE_PATH, "utf-8");
    return JSON.parse(contents) as ServerState;
  } catch (error) {
    const initial: ServerState = { matches: [], results: [] };
    await writeServerState(initial);
    return initial;
  }
}

async function writeServerState(state: ServerState) {
  // try Redis first when configured (supports multiple env var names)
  try {
    const client = await getRedisClient();
    if (client) {
      try {
        await client.set("omnicade:server-state", JSON.stringify(state));
        return;
      } catch {
        // fall back to file system
      }
    }
  } catch {}

  await fs.mkdir(join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(
    SERVER_STATE_PATH,
    JSON.stringify(state, null, 2),
    "utf-8",
  );
}

function extractTokenFromRedisUrl(url: string | undefined) {
  if (!url) return null;
  const m = url.match(/^[a-z]+:\/\/[^:]+:([^@]+)@([^:/]+)(?::\d+)?/i);
  if (!m) return null;
  return { token: decodeURIComponent(m[1]), host: m[2] };
}

async function getRedisClient() {
  let restUrl =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  let token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if ((!restUrl || !token) && (process.env.KV_URL || process.env.REDIS_URL)) {
    const candidate = process.env.KV_URL ?? process.env.REDIS_URL;
    const parsed = extractTokenFromRedisUrl(candidate);
    if (parsed) {
      token = token ?? parsed.token;
      restUrl = restUrl ?? `https://${parsed.host}`;
    }
  }

  if (!restUrl || !token) return null;

  try {
    const { Redis } = await import("@upstash/redis");
    return new Redis({ url: restUrl, token });
  } catch {
    return null;
  }
}

async function publishMatchUpdate(match: GameState) {
  const client = await getRedisClient();
  if (!client) return;
  try {
    await client.publish(`match:${match.id}`, JSON.stringify(match));
  } catch {
    // ignore publish errors
  }
}

function createConnect4Board(): Connect4Cell[][] {
  return Array.from({ length: 6 }, () => Array<Connect4Cell>(7).fill(null));
}

function createTicTacToeBoard(): TicTacToeCell[] {
  return Array(9).fill(null);
}

function getOpponentRole(role: PlayerRole): PlayerRole {
  if (role === "R") return "Y";
  if (role === "Y") return "R";
  if (role === "X") return "O";
  return "X";
}

function checkConnect4Winner(board: Connect4Cell[][]): PlayerRole | null {
  const rows = 6;
  const cols = 7;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ] as const;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const current = board[row][col];
      if (!current) continue;

      for (const [dy, dx] of directions) {
        let count = 1;
        let r = row + dy;
        let c = col + dx;

        while (
          r >= 0 &&
          r < rows &&
          c >= 0 &&
          c < cols &&
          board[r][c] === current
        ) {
          count += 1;
          r += dy;
          c += dx;
        }

        if (count >= 4) {
          return current;
        }
      }
    }
  }

  return null;
}

function checkTicTacToeWinner(board: TicTacToeCell[]): PlayerRole | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function getInitialState(gameType: GameType, hostId: string): GameState {
  const now = nowISOString();
  if (gameType === "connect4") {
    return {
      id: crypto.randomUUID(),
      gameType,
      host: { id: hostId, role: "R" },
      turn: "R",
      status: "waiting",
      createdAt: now,
      updatedAt: now,
      winner: null,
      history: [],
      board: createConnect4Board(),
    };
  }

  return {
    id: crypto.randomUUID(),
    gameType,
    host: { id: hostId, role: "X" },
    turn: "X",
    status: "waiting",
    createdAt: now,
    updatedAt: now,
    winner: null,
    history: [],
    board: createTicTacToeBoard(),
  };
}

export async function joinMatch(gameType: GameType, playerId: string) {
  const state = await readServerState();
  const existing = state.matches.find(
    (match) =>
      match.gameType === gameType &&
      match.status === "waiting" &&
      match.host.id !== playerId,
  );

  if (existing) {
    const guestRole = getOpponentRole(existing.host.role);
    existing.guest = { id: playerId, role: guestRole };
    existing.status = "playing";
    existing.updatedAt = nowISOString();
    await writeServerState(state);
    await publishMatchUpdate(existing);
    return existing;
  }

  const match = getInitialState(gameType, playerId);
  state.matches.push(match);
  await writeServerState(state);
  await publishMatchUpdate(match);
  return match;
}

export async function createInvite(
  gameType: GameType,
  hostId: string,
  ttlSeconds = 60 * 60,
) {
  const state = await readServerState();
  const match = getInitialState(gameType, hostId);
  state.matches.push(match);

  const code = crypto.randomUUID().split("-")[0];
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  state.invites = state.invites || [];
  state.invites.push({ code, matchId: match.id, expiresAt });

  await writeServerState(state);
  return { code, match };
}

export async function joinByInvite(code: string, playerId: string) {
  const state = await readServerState();
  state.invites =
    state.invites?.filter((i) => new Date(i.expiresAt) > new Date()) ?? [];
  const invite = state.invites?.find((i) => i.code === code);
  if (!invite) throw new Error("Invite not found or expired");

  const match = state.matches.find((m) => m.id === invite.matchId);
  if (!match) throw new Error("Match for invite not found");

  if (match.host.id === playerId) return match;
  if (match.guest && match.guest.id === playerId) return match;

  const guestRole = getOpponentRole(match.host.role);
  match.guest = { id: playerId, role: guestRole };
  match.status = "playing";
  match.updatedAt = nowISOString();

  await writeServerState(state);
  await publishMatchUpdate(match);
  return match;
}

export async function getMatch(gameId: string) {
  const state = await readServerState();
  return state.matches.find((match) => match.id === gameId) ?? null;
}

export async function submitScore(
  playerId: string,
  gameType: string,
  value: number,
) {
  const state = await readServerState();
  state.scores = state.scores || [];
  state.scores.push({
    id: crypto.randomUUID(),
    playerId,
    gameType,
    value,
    at: nowISOString(),
  });
  await writeServerState(state);
  return { ok: true };
}

function applyConnect4Move(
  board: Connect4Cell[][],
  column: number,
  role: "R" | "Y",
) {
  const nextBoard = board.map((row) => [...row]) as Connect4Cell[][];
  for (let row = 5; row >= 0; row--) {
    if (!nextBoard[row][column]) {
      nextBoard[row][column] = role;
      return nextBoard;
    }
  }
  throw new Error("Column is full");
}

export async function submitMove(
  gameId: string,
  playerId: string,
  payload: { column?: number; index?: number },
) {
  const state = await readServerState();
  const match = state.matches.find((item) => item.id === gameId);
  if (!match) {
    throw new Error("Match not found");
  }
  if (match.status === "completed") {
    throw new Error("This match has already finished");
  }

  const playerRole =
    match.host.id === playerId
      ? match.host.role
      : match.guest?.id === playerId
        ? match.guest.role
        : null;
  if (!playerRole) {
    throw new Error("Player is not part of this match");
  }
  if (playerRole !== match.turn) {
    throw new Error("Not your turn");
  }

  let winner: PlayerRole | null = null;

  if (match.gameType === "connect4") {
    if (
      payload.column === undefined ||
      payload.column < 0 ||
      payload.column > 6
    ) {
      throw new Error("Invalid column");
    }
    if (playerRole !== "R" && playerRole !== "Y") {
      throw new Error("Invalid player role");
    }
    match.board = applyConnect4Move(match.board, payload.column, playerRole);
    winner = checkConnect4Winner(match.board);
  } else {
    if (payload.index === undefined || payload.index < 0 || payload.index > 8) {
      throw new Error("Invalid index");
    }
    if ((match.board as TicTacToeCell[])[payload.index]) {
      throw new Error("Cell already taken");
    }
    if (playerRole !== "X" && playerRole !== "O") {
      throw new Error("Invalid player role");
    }
    const nextBoard = [...(match.board as TicTacToeCell[])];
    nextBoard[payload.index] = playerRole;
    match.board = nextBoard;
    winner = checkTicTacToeWinner(nextBoard);
  }

  match.winner = winner;
  const isBoardFull =
    match.gameType === "connect4"
      ? match.board.flat().every(Boolean)
      : (match.board as TicTacToeCell[]).every(Boolean);

  if (winner) {
    match.status = "completed";
    const existingResult: MatchResult = {
      gameId: match.id,
      gameType: match.gameType,
      winner,
      winnerPlayerId: playerId,
      finishedAt: nowISOString(),
    };
    state.results.push(existingResult);
  } else if (isBoardFull) {
    match.status = "completed";
    state.results.push({
      gameId: match.id,
      gameType: match.gameType,
      winner: null,
      winnerPlayerId: null,
      finishedAt: nowISOString(),
    });
  } else {
    match.turn = getOpponentRole(playerRole);
  }

  match.updatedAt = nowISOString();
  match.history.push({
    playerId,
    action: "move",
    payload,
    at: match.updatedAt,
  });
  await writeServerState(state);
  await publishMatchUpdate(match);
  return match;
}

export async function getLeaderboard() {
  const state = await readServerState();
  const counts = state.results.reduce<Record<string, number>>((acc, result) => {
    if (!result.winnerPlayerId) return acc;
    acc[result.winnerPlayerId] = (acc[result.winnerPlayerId] ?? 0) + 1;
    return acc;
  }, {});
  return {
    results: state.results,
    playerWins: counts,
    scores: state.scores ?? [],
  };
}
