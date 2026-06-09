#!/usr/bin/env node
import { Redis } from "@upstash/redis";

function extractTokenFromRedisUrl(url) {
  if (!url) return null;
  const m = url.match(/^[a-z]+:\/\/[^:]+:([^@]+)@([^:/]+)(?::\d+)?/i);
  if (!m) return null;
  return { token: decodeURIComponent(m[1]), host: m[2] };
}

async function getClient() {
  let restUrl =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  let token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if ((!restUrl || !token) && (process.env.KV_URL || process.env.REDIS_URL)) {
    const candidate = process.env.KV_URL ?? process.env.REDIS_URL;
    const parsed = extractTokenFromRedisUrl(candidate);
    if (parsed) {
      token = token ?? parsed.token;
      restUrl = restUrl ?? `https://${parsed.host}`;
    }
  }

  if (!restUrl || !token) {
    console.error("Missing Upstash REST URL/token in env");
    process.exit(2);
  }

  return new Redis({ url: restUrl, token });
}

async function main() {
  try {
    const client = await getClient();
    const raw = await client.get("omnicade:server-state");
    if (!raw) {
      console.log("No key found: omnicade:server-state");
      return;
    }
    const state = typeof raw === "string" ? JSON.parse(raw) : raw;
    const matches = Array.isArray(state.matches) ? state.matches.length : 0;
    const results = Array.isArray(state.results) ? state.results.length : 0;
    const invites = Array.isArray(state.invites) ? state.invites.length : 0;
    const scores = Array.isArray(state.scores) ? state.scores.length : 0;

    console.log(
      JSON.stringify(
        {
          matches,
          results,
          invites,
          scores,
          sampleMatch: state.matches?.[0] ?? null,
        },
        null,
        2,
      ),
    );
  } catch (err) {
    console.error(
      "Verify failed:",
      err instanceof Error ? err.message : String(err),
    );
    process.exit(1);
  }
}

main();
