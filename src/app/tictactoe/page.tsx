"use client";

import { useEffect, useMemo, useState } from "react";
import InviteUI from "@/components/InviteUI";

type Player = "X" | "O" | null;
type MatchStatus = "waiting" | "playing" | "completed";

type MatchState = {
  id: string;
  gameType: "tictactoe";
  host: { id: string; role: "X" | "O" };
  guest?: { id: string; role: "X" | "O" };
  turn: "X" | "O";
  status: MatchStatus;
  board: Player[];
  winner: "X" | "O" | null;
  createdAt: string;
  updatedAt: string;
};

type Winner = {
  player: "X" | "O";
  line: number[];
} | null;

const WINNING = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Player[]): Winner {
  for (const line of WINNING) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a] as "X" | "O", line };
    }
  }

  return null;
}

const CONFETTI_PARTICLES = Array.from({ length: 28 }, (_, index) => ({
  left: Math.round(Math.random() * 90),
  top: -18 + Math.round(Math.random() * 18),
  size: 6 + (index % 5) * 2,
  rounded: index % 3 !== 0,
  color: ["#22c55e", "#f97316", "#38bdf8", "#e879f9", "#fde68a"][index % 5],
  delay: `${(index % 8) * 100}ms`,
  duration: `${1200 + (index % 5) * 140}ms`,
  rotate: 45 + (index % 7) * 20,
}));

export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [playerId, setPlayerId] = useState<string>("");
  const [mode, setMode] = useState<"local" | "online">("local");
  const [gameId, setGameId] = useState<string | null>(null);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);

  useEffect(() => {
    let stored = window.localStorage.getItem("omnicade-player-id");
    if (!stored) {
      stored = crypto.randomUUID();
      window.localStorage.setItem("omnicade-player-id", stored);
    }
    setPlayerId(stored);
  }, []);

  useEffect(() => {
    if (!gameId || mode !== "online" || !playerId) return;

    // keep polling as a fallback
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/game/${gameId}?playerId=${playerId}`,
        );
        const body = await response.json();
        if (body?.game) {
          setMatchState(body.game as MatchState);
        }
      } catch (error) {
        // ignore polling errors; we'll retry
      }
    }, 1500);

    // SSE real-time updates
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/game/${gameId}/events`);
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data) as MatchState;
          setMatchState(payload);
        } catch {}
      };
    } catch {}

    return () => {
      window.clearInterval(interval);
      if (es) es.close();
    };
  }, [gameId, mode, playerId]);

  const result = useMemo(() => {
    if (mode === "online" && matchState) {
      return matchState.winner ? { player: matchState.winner, line: [] } : null;
    }
    return checkWinner(board);
  }, [mode, matchState, board]);

  const currentBoard =
    mode === "online" && matchState ? matchState.board : board;
  const currentTurn = mode === "online" && matchState ? matchState.turn : turn;
  const isWaiting = mode === "online" && matchState?.status === "waiting";
  const isDraw = !result && currentBoard.every(Boolean);
  const finished = Boolean(result) || isDraw;
  const status = matchState
    ? matchState.status === "waiting"
      ? "Waiting for opponent..."
      : result
        ? `${result.player} wins!`
        : isDraw
          ? "Draw!"
          : `Turn: ${currentTurn}`
    : result
      ? `${result.player} wins!`
      : isDraw
        ? "Draw!"
        : `Turn: ${currentTurn}`;

  const winningCells = result?.line ?? [];
  const moves = currentBoard.filter(Boolean).length;
  const popupTitle = result ? `🎉 ${result.player} wins!` : "Stalemate!";
  const popupDescription = result
    ? result.player === "X"
      ? "X claims the board with a sharp winning line."
      : "O closes out the match with a smooth finish."
    : "Nobody won this round. Reset and try a different strategy.";

  function localPlay(i: number) {
    if (currentBoard[i] || result) return;
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    setTurn((current) => (current === "X" ? "O" : "X"));
  }

  async function onlinePlay(i: number) {
    if (!matchState || matchState.status !== "playing") return;
    const playerRole =
      matchState.host.id === playerId
        ? matchState.host.role
        : matchState.guest?.role;
    if (!playerRole || playerRole !== matchState.turn) {
      setOnlineError("It's not your turn yet.");
      return;
    }

    try {
      const response = await fetch(`/api/game/${matchState.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, payload: { index: i } }),
      });
      const body = await response.json();
      if (body.error) {
        setOnlineError(body.error);
      } else if (body.game) {
        setMatchState(body.game as MatchState);
        setOnlineError(null);
      }
    } catch (error) {
      setOnlineError("Unable to send your move. Try again.");
    }
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setMatchState(null);
    setGameId(null);
    setOnlineError(null);
    setMode("local");
  }

  async function startMatchmaking() {
    setIsJoining(true);
    setOnlineError(null);
    try {
      const response = await fetch("/api/matchmaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: "tictactoe", playerId }),
      });
      const body = await response.json();
      if (body.error) {
        setOnlineError(body.error);
      } else {
        setMode("online");
        setMatchState(body.game as MatchState);
        setGameId(body.gameId);
      }
    } catch (error) {
      setOnlineError("Matchmaking failed. Please refresh and try again.");
    } finally {
      setIsJoining(false);
    }
  }

  const playerRole =
    matchState?.host.id === playerId
      ? matchState.host.role
      : matchState?.guest?.role;
  const canMoveOnline =
    matchState?.status === "playing" && playerRole === matchState.turn;

  return (
    <main className="mx-auto w-full max-w-xs space-y-6">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/85 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Tic Tac Toe</h1>
            <p className="mt-1 text-sm text-slate-400">
              A quick, polished 3×3 matchup.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("local")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "local" ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
            >
              Local
            </button>
            <button
              type="button"
              onClick={startMatchmaking}
              disabled={isJoining}
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isJoining ? "Finding opponent…" : "Matchmake online"}
            </button>
            <div className="ml-2">
              <InviteUI
                gameType="tictactoe"
                onJoined={(g) => {
                  setMode("online");
                  setMatchState(g);
                  setGameId(g.id);
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-3xl bg-slate-950/75 p-4 text-sm text-slate-300 shadow-inner shadow-slate-950/10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-200 ring-1 ring-cyan-500/20">
              {status}
            </span>
            <span className="rounded-full bg-slate-800/90 px-3 py-1 text-slate-200">
              Moves: {moves}
            </span>
            <span className="rounded-full bg-slate-800/90 px-3 py-1 text-slate-200">
              Next: {finished ? "—" : currentTurn}
            </span>
            {mode === "online" && matchState && (
              <span className="rounded-full bg-slate-800/90 px-3 py-1 text-slate-200">
                You are: {playerRole ?? "—"}
              </span>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-900/90 p-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                Game state
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {result
                  ? `Winner: ${result.player}`
                  : isDraw
                    ? "Board is full"
                    : `Continue until one player gets three in a row.`}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-900/90 p-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                Tip
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {result
                  ? "Press New game to play again."
                  : "Try forcing a fork to win faster."}
              </p>
            </div>
          </div>

          {mode === "online" && matchState?.status === "waiting" && (
            <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-200">
              Waiting for an opponent to join. Once another player connects, the
              match begins.
            </div>
          )}

          {onlineError && (
            <div className="rounded-2xl bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
              {onlineError}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/20">
        {currentBoard.map((cell, i) => {
          const isWinner = winningCells.includes(i);
          const disabled =
            Boolean(cell) ||
            finished ||
            (mode === "online" &&
              (!canMoveOnline || matchState?.status !== "playing"));
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (mode === "online") onlinePlay(i);
                else localPlay(i);
              }}
              disabled={disabled}
              className={`aspect-square rounded-3xl border border-white/10 bg-slate-950/90 text-3xl font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${isWinner ? "bg-cyan-500 text-slate-950 shadow-[0_0_0_8px_rgba(56,189,248,0.16)]" : "hover:bg-slate-900"}`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Reset board
        </button>
        {mode === "online" && gameId && (
          <button
            type="button"
            onClick={() => {
              setMode("local");
              setMatchState(null);
              setGameId(null);
              setOnlineError(null);
            }}
            className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Leave match
          </button>
        )}
      </div>

      {finished ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {CONFETTI_PARTICLES.map((particle, index) => (
              <span
                key={index}
                className="absolute opacity-90 animate-confetti"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  borderRadius: particle.rounded ? "50%" : "20%",
                  background: particle.color,
                  boxShadow: `0 0 ${particle.size / 1.8}px ${particle.color}`,
                  transform: `rotate(${particle.rotate}deg)`,
                  animationDelay: particle.delay,
                  animationDuration: particle.duration,
                }}
              />
            ))}
          </div>

          <div className="relative w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-900/95 p-6 text-center shadow-xl shadow-cyan-500/20">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              Game Over
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-white">
              {popupTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {popupDescription}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Play again
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
