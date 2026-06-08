import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/connect4", label: "Connect 4" },
  { href: "/tictactoe", label: "Tic Tac Toe" },
  { href: "/memory", label: "Memory" },
];

export default function GameNav() {
  return (
    <nav className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-white/10 bg-slate-900/90 px-3 py-3 text-sm shadow-lg shadow-black/10 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-200">
          Arcade menu
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-white/10 bg-slate-950/90 px-3 py-1 text-slate-200 transition hover:bg-slate-800"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
