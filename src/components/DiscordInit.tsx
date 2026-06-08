"use client";

import { useEffect } from "react";
import { getDiscordSdk } from "@/lib/discord";

export default function DiscordInit() {
  useEffect(() => {
    const sdk = getDiscordSdk();
    if (!sdk) return;
    sdk.ready();
  }, []);

  return null;
}
