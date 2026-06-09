import { NextRequest } from "next/server";
import { getMatch } from "@/lib/multiplayer";

function extractTokenFromRedisUrl(url: string | undefined) {
  if (!url) return null;
  const match = url.match(/^[a-z]+:\/\/[^:]+:([^@]+)@([^:/]+)(?::\d+)?/i);
  if (!match) return null;
  return { token: decodeURIComponent(match[1]), host: match[2] };
}

async function getRedisClient() {
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

  if (!restUrl || !token) return null;
  try {
    const { Redis } = await import("@upstash/redis");
    return new Redis({ url: restUrl, token });
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: any) {
  const params = await context.params;
  const gameId = params.gameId as string;

  const match = await getMatch(gameId);
  if (!match) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // send initial state
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(match)}\n\n`));

      const client = await getRedisClient();
      let subscriber: any | null = null;
      if (client) {
        try {
          subscriber = client.subscribe(`match:${gameId}`);
          subscriber.on("message", (event: any) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event.message)}\n\n`),
            );
          });
        } catch (err) {
          // ignore
        }
      }

      // stop when request aborted
      const sig = request.signal;
      sig.addEventListener("abort", async () => {
        try {
          if (subscriber) await subscriber.unsubscribe();
        } catch {}
        controller.close();
      });
    },
    cancel() {
      // noop
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
