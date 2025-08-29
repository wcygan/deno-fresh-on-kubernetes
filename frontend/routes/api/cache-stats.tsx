// API route to show cache statistics for debugging
import { define } from "../../utils.ts";
import { getCacheStats } from "../../lib/stripe.ts";

export const handler = define.handlers({
  GET() {
    const dev = Deno.env.get("NODE_ENV") !== "production";
    if (!dev) return new Response("Not found", { status: 404 });

    const stats = getCacheStats();
    return Response.json({
      cache: {
        keys: stats.keys,
        // TTL cache doesn't track hits/misses like NodeCache did
        hits: 0,
        misses: 0,
        hitRate: "N/A",
        note: "TTL cache implementation doesn't track hit/miss statistics",
      },
      timestamp: new Date().toISOString(),
    });
  },
});
