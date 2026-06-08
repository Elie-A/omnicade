import { DiscordSDK } from "@discord/embedded-app-sdk";

let discordSdk: DiscordSDK | null = null;

export function getDiscordSdk() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  if (!params.has("frame_id")) return null;

  if (!discordSdk) {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    if (!clientId) {
      throw new Error("Missing NEXT_PUBLIC_DISCORD_CLIENT_ID");
    }
    discordSdk = new DiscordSDK(clientId);
  }

  return discordSdk;
}
