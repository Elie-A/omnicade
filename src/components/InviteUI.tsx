"use client";

import { useState } from "react";

export default function InviteUI({
  gameType,
  onJoined,
}: {
  gameType: string;
  onJoined?: (game: any) => void;
}) {
  const [code, setCode] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createInvite() {
    setError(null);
    try {
      const playerId = window.localStorage.getItem("omnicade-player-id");
      const res = await fetch("/api/invite/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType, playerId }),
      });
      const body = await res.json();
      if (body.error) {
        setError(body.error);
        return;
      }
      setCreated(body.code);
      if (onJoined) onJoined(body.game);
    } catch (err) {
      setError("Failed to create invite");
    }
  }

  async function joinInvite() {
    setJoining(true);
    setError(null);
    try {
      const playerId = window.localStorage.getItem("omnicade-player-id");
      const res = await fetch("/api/invite/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, playerId }),
      });
      const body = await res.json();
      if (body.error) {
        setError(body.error);
        setJoining(false);
        return;
      }
      if (onJoined) onJoined(body.game);
    } catch (err) {
      setError("Failed to join invite");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={createInvite}
          className="rounded-full bg-slate-800 px-3 py-1 text-sm text-white"
        >
          Create invite
        </button>
        <span className="text-sm text-slate-300">
          {created ? `Code: ${created}` : "Or join with code"}
        </span>
      </div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Invite code"
          className="rounded-2xl bg-slate-950/90 px-3 py-2 text-sm text-white"
        />
        <button
          onClick={joinInvite}
          disabled={joining}
          className="rounded-full bg-cyan-500 px-3 py-1 text-sm font-semibold text-slate-950"
        >
          {joining ? "Joining…" : "Join"}
        </button>
      </div>
      {error && <div className="text-rose-400 text-sm">{error}</div>}
    </div>
  );
}
