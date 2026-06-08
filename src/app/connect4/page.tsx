"use client";

import { useState } from "react";

const ROWS = 6;
const COLS = 7;

type Cell = "R" | "Y" | null;

type Winner = {
  player: "R" | "Y";
  line: number[];
} | null;

function createBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function checkWinner(board: Cell[][]): Winner {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ] as const;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col];
      if (!cell) continue;

      for (const [dy, dx] of directions) {
        const line = [row * COLS + col];
        let r = row + dy;
        let c = col + dx;

        while (
          r >= 0 &&
          r < ROWS &&
          c >= 0 &&
          c < COLS &&
          board[r][c] === cell
        ) {
          line.push(r * COLS + c);
          r += dy;
          c += dx;
        }

        if (line.length >= 4) {
          return { player: cell, line };
        }
      }
    }
  }

  return null;
}

function drop(board: Cell[][], col: number, player: Cell) {
  const newBoard = board.map((row) => [...row]);

  for (let row = ROWS - 1; row >= 0; row--) {
    if (!newBoard[row][col]) {
      newBoard[row][col] = player;
      break;
    }
  }

  return newBoard;
}

const CONFETTI_PARTICLES = Array.from({ length: 28 }, (_, index) => ({
  left: Math.round(Math.random() * 90),
  top: -20 + Math.round(Math.random() * 16),
  size: 7 + (index % 4) * 2,
  rounded: index % 4 !== 0,
  color: ["#f97316", "#22c55e", "#38bdf8", "#fb7185", "#fde68a"][index % 5],
  delay: `${(index % 8) * 90}ms`,
  duration: `${1150 + (index % 5) * 130}ms`,
  rotate: 30 + (index % 6) * 25,
}));

export default function Connect4() {
  const [board, setBoard] = useState(createBoard());
  const [turn, setTurn] = useState<Cell>("R");

  const result = checkWinner(board);
  const isDraw = !result && board.flat().every(Boolean);
  const finished = Boolean(result) || isDraw;
  const status = result
    ? `${result.player === "R" ? "Red" : "Yellow"} wins!`
    : isDraw
      ? "Draw!"
      : `Turn: ${turn === "R" ? "Red" : "Yellow"}`;

  const remainingMoves = board.flat().filter((cell) => cell === null).length;
  const winnerName = result ? (result.player === "R" ? "Red" : "Yellow") : null;
  const popupTitle = result ? `🏆 ${winnerName} connects four!` : "Stalemate!";
  const popupDescription = result
    ? result.player === "R"
      ? "Red poured in a winning line and claimed the board."
      : "Yellow floated to victory with a perfect drop."
    : "No winner this time. Reset and try again.";

  function play(col: number) {
    if (result || board[0][col]) return;

    setBoard((prev) => drop(prev, col, turn));
    setTurn((current) => (current === "R" ? "Y" : "R"));
  }

  function reset() {
    setBoard(createBoard());
    setTurn("R");
  }

  return (
    <main className="mx-auto w-full max-w-xl space-y-6">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/85 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Connect 4</h1>
            <p className="mt-1 text-sm text-slate-400">
              Drop pieces and connect four in a row.
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
              Remaining: {remainingMoves}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-900/90 p-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                Game insight
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {result
                  ? `Winner: ${result.player === "R" ? "Red" : "Yellow"}`
                  : `Use the drop buttons above to place your next piece.`}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-900/90 p-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                Hint
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {result
                  ? "Reset to play again and try a new strategy."
                  : "Block your opponent or build a vertical connect!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/20">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: COLS }).map((_, index) => {
            const isFull = Boolean(board[0][index]);
            return (
              <button
                key={index}
                type="button"
                onClick={() => play(index)}
                disabled={isFull || Boolean(result)}
                className={`aspect-square rounded-2xl px-2 text-base transition ${isFull || Boolean(result) ? "bg-slate-800/60 text-slate-500 cursor-not-allowed" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
              >
                ↓
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {board.flatMap((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const slotIndex = rowIndex * COLS + colIndex;
              const isWinner = result?.line.includes(slotIndex);
              const colorClass =
                cell === "R"
                  ? "bg-red-500 shadow-red-500/30"
                  : cell === "Y"
                    ? "bg-amber-400 shadow-amber-400/30"
                    : "bg-slate-800/90";

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`aspect-square rounded-full border border-slate-700/60 ${colorClass} flex items-center justify-center shadow-inner ${isWinner ? "ring-2 ring-cyan-300/70" : ""}`}
                />
              );
            }),
          )}
        </div>
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
                  borderRadius: particle.rounded ? "50%" : "22%",
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
