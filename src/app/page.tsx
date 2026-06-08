import Link from "next/link";

const games = [
  {
    href: "/connect4",
    title: "Connect 4",
    description: "Drop pieces and line up four in a row.",
  },
  {
    href: "/tictactoe",
    title: "Tic Tac Toe",
    description: "Classic X vs O gameplay with instant feedback.",
  },
  {
    href: "/memory",
    title: "Memory",
    description: "Flip cards to reveal matches before time runs out.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8">
      <section className="grid gap-6">
        <div className="rounded-3xl border border-cyan-400/10 bg-cyan-500/10 p-6 shadow-lg shadow-cyan-500/5 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            Arcade hub
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
            Games made for quick fun.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Choose a game and enjoy a friendly, polished experience with
            consistent controls, responsive boards, and a sleek dark theme.
          </p>
        </div>

        <div className="grid gap-4">
          {games.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 transition hover:-translate-y-0.5 hover:bg-slate-900/95"
            >
              <h3 className="text-base font-semibold text-white">
                {game.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {game.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
