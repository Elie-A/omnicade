#!/usr/bin/env node
import { readFile } from "fs/promises";
import { Redis } from "@upstash/redis";

function extractTokenFromRedisUrl(url) {
  if (!url) return null;
  const m = url.match(/^[a-z]+:\/\/[^:]+:([^@]+)@([^:/]+)(?::\d+)?/i);
  if (!m) return null;
  return { token: decodeURIComponent(m[1]), host: m[2] };
}

async function main() {
  // prefer explicit REST vars, fall back to KV_* or REDIS/ KV URL parsing
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
    console.error(
      "Missing REST URL or token. Set UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN or KV_REST_API_URL/KV_REST_API_TOKEN or KV_URL/REDIS_URL in env",
    );
    process.exitCode = 2;
    return;
  }

  const path = new URL(
    "../data/server-state.json",
    import.meta.url,
  ).pathname.replace(/^\//, "");
  try {
    const raw = await readFile(path, "utf-8");
    const state = JSON.parse(raw);

    const client = new Redis({ url: restUrl, token });
    console.log("Writing state to Upstash at key: omnicade:server-state");
    await client.set("omnicade:server-state", JSON.stringify(state));
    const stored = await client.get("omnicade:server-state");
    if (!stored) {
      console.error("Failed to read back state from Upstash");
      process.exitCode = 3;
      return;
    }

    const parsed = typeof stored === "string" ? JSON.parse(stored) : stored;
    const matches = Array.isArray(parsed.matches) ? parsed.matches.length : 0;
    const results = Array.isArray(parsed.results) ? parsed.results.length : 0;
    console.log(`Migration complete. matches=${matches}, results=${results}`);
  } catch (err) {
    console.error(
      "Migration failed:",
      err instanceof Error ? err.message : String(err),
    );
    process.exitCode = 1;
  }
}

main();
