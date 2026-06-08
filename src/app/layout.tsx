import "./globals.css";
import DiscordInit from "@/components/DiscordInit";
import GameNav from "@/components/GameNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DiscordInit />
        <div className="min-h-screen bg-slate-950/80">
          <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
            <header className="mb-4 rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/20 backdrop-blur-md sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
                    Discord Arcade
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Play classic games with clean, modern UI.
                  </h1>
                </div>
                <p className="max-w-lg text-sm leading-6 text-slate-300 sm:text-right">
                  Use the menu below to quit a game, switch titles, or return
                  home.
                </p>
              </div>
            </header>

            <GameNav />

            <main className="grow rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-lg shadow-black/15 backdrop-blur-md sm:p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
