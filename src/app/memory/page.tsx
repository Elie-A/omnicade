"use client";

import { useEffect, useState } from "react";

const emojiPool = [
  "🍎",
  "🍌",
  "🍇",
  "🍒",
  "🍓",
  "🥝",
  "🍍",
  "🍉",
  "🍑",
  "🍊",
  "🍋",
  "🍐",
];
const defaultPairs = 4;

function buildCards(pairCount: number) {
  const shuffled = [...emojiPool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, pairCount);
  return [...selected, ...selected].sort(() => Math.random() - 0.5);
}

export default function Memory() {
  const minPairs = 2;
  const maxPairs = emojiPool.length;
  const [pairCount, setPairCount] = useState(defaultPairs);
  const [customPairs, setCustomPairs] = useState(defaultPairs.toString());
  const [cards, setCards] = useState<string[]>(() => buildCards(defaultPairs));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (flipped.length !== 2) return;

    const [firstIndex, secondIndex] = flipped;
    const firstCard = cards[firstIndex];
    const secondCard = cards[secondIndex];

    if (firstCard === secondCard) {
      setMatched((prev) => [...prev, firstIndex, secondIndex]);
      setFlipped([]);
      return;
    }

    setDisabled(true);
    const timeout = window.setTimeout(() => {
      setFlipped([]);
      setDisabled(false);
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [flipped, cards]);

  function flip(i: number) {
    if (disabled) return;
    if (flipped.includes(i) || matched.includes(i)) return;
    if (flipped.length === 2) return;
    setFlipped((prev) => [...prev, i]);
  }

  function resetGame(updatedPairs = pairCount) {
    setPairCount(updatedPairs);
    setFlipped([]);
    setMatched([]);
    setDisabled(false);
    setCards(buildCards(updatedPairs));
  }

  const pairsMatched = matched.length / 2;
  const isComplete = pairsMatched === pairCount;

  return (
    <main className="mx-auto w-full max-w-xs space-y-6">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/85 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Memory</h1>
            <p className="mt-1 text-sm text-slate-400">
              Match pairs by flipping the cards.
            </p>
          </div>

          <button
            type="button"
            onClick={() => resetGame(pairCount)}
            className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Restart
          </button>
        </div>

        <div className="grid gap-3 rounded-3xl bg-slate-950/75 p-4 text-sm text-slate-300 shadow-inner shadow-slate-950/10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-200 ring-1 ring-cyan-500/20">
              Pairs: {pairCount}
            </span>
            <span className="rounded-full bg-slate-800/90 px-3 py-1 text-slate-200">
              Matched: {pairsMatched}
            </span>
            <span className="rounded-full bg-slate-800/90 px-3 py-1 text-slate-200">
              Remaining: {pairCount - pairsMatched}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-900/90 p-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                Challenge
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {isComplete
                  ? `You completed ${pairCount} pairs!`
                  : `Find all ${pairCount} pairs before time slows you down.`}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-900/90 p-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                Hint
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {isComplete
                  ? "Nice work! Try more pairs for a bigger challenge."
                  : "Remember the location of each emoji and match faster."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-[1fr_auto]">
          {[4, 6, 8].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => {
                setCustomPairs(count.toString());
                setError(null);
                resetGame(count);
              }}
              className={`rounded-full px-3 py-1 transition ${pairCount === count ? "bg-cyan-500 text-slate-950" : "bg-slate-950/70 text-slate-300 hover:bg-slate-900"}`}
            >
              {count} pairs
            </button>
          ))}

          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Custom pairs
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={minPairs}
                max={maxPairs}
                value={customPairs}
                onChange={(event) => {
                  setCustomPairs(event.target.value);
                  setError(null);
                }}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                placeholder={`${minPairs}-${maxPairs}`}
              />
              <button
                type="button"
                onClick={() => {
                  const parsed = Number(customPairs.trim());
                  if (!Number.isInteger(parsed)) {
                    setError("Enter a whole number.");
                    return;
                  }
                  if (parsed < minPairs || parsed > maxPairs) {
                    setError(
                      `Choose between ${minPairs} and ${maxPairs} pairs.`,
                    );
                    return;
                  }
                  setError(null);
                  resetGame(parsed);
                }}
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Set
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        {isComplete && (
          <div className="rounded-3xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Nice work! You matched all {pairCount} pairs.
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/20">
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(i) || matched.includes(i);
          const isMatched = matched.includes(i);

          return (
            <button
              key={i}
              type="button"
              className={`aspect-square rounded-3xl border border-white/10 text-2xl font-medium transition ${isFlipped ? "bg-slate-200 text-slate-900" : "bg-slate-950 text-slate-100 hover:bg-slate-900"} ${isMatched ? "shadow-[0_0_0_4px_rgba(34,197,94,0.12)]" : ""}`}
              onClick={() => flip(i)}
              disabled={disabled || isFlipped}
            >
              {isFlipped ? card : "?"}
            </button>
          );
        })}
      </div>
    </main>
  );
}
