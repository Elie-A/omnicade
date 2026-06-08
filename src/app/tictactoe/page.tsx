"use client";

import { useState } from "react";

type Player = "X" | "O" | null;

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

  const result = checkWinner(board);
  const isDraw = !result && board.every(Boolean);
  const finished = Boolean(result) || isDraw;
  const status = result
    ? `${result.player} wins!`
    : isDraw
      ? "Draw!"
      : `Turn: ${turn}`;

  const winningCells = result?.line ?? [];
  const moves = board.filter(Boolean).length;
  const popupTitle = result ? `🎉 ${result.player} wins!` : "Stalemate!";
  const popupDescription = result
    ? result.player === "X"
      ? "X claims the board with a sharp winning line."
      : "O closes out the match with a smooth finish."
    : "Nobody won this round. Reset and try a different strategy.";

  function play(i: number) {
    if (board[i] || result) return;

    const next = [...board];
    next[i] = turn;

    setBoard(next);
    setTurn((current) => (current === "X" ? "O" : "X"));
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setTurn("X");
  }

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
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            New game
          </button>
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
              Next: {result ? "—" : turn}
            </span>
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
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/20">
        {board.map((cell, i) => {
          const isWinner = winningCells.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => play(i)}
              className={`aspect-square rounded-3xl border border-white/10 bg-slate-950/90 text-3xl font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${isWinner ? "bg-cyan-500 text-slate-950 shadow-[0_0_0_8px_rgba(56,189,248,0.16)]" : "hover:bg-slate-900"}`}
            >
              {cell}
            </button>
          );
        })}
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
