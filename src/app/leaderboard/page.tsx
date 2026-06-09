"use client";

import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => {
        if (mounted) setData(d);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!data)
    return <div className="text-sm text-slate-300">Loading leaderboard…</div>;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900/85 p-6">
        <h1 className="text-2xl font-semibold text-white">Leaderboard</h1>
        <p className="mt-2 text-sm text-slate-300">Wins and recent scores.</p>

        <div className="mt-4 grid gap-4">
          <div>
            <h3 className="text-sm text-slate-400">Match wins</h3>
            <ul className="mt-2 text-sm text-slate-200">
              {Object.entries(data.playerWins || {})
                .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
                .map(([playerId, wins]) => (
                  <li key={playerId}>
                    {playerId}: {String(wins)} wins
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm text-slate-400">Recent scores</h3>
            <ul className="mt-2 text-sm text-slate-200">
              {(data.scores || [])
                .slice()
                .reverse()
                .slice(0, 20)
                .map((s: any) => (
                  <li key={s.id}>
                    {s.playerId} — {s.gameType} — {s.value}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
