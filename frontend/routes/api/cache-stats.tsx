// API route to show cache statistics for debugging
import { define } from "../../utils.ts";
import { getCacheStats } from "../../lib/stripe.ts";

export const handler = define.handlers({
  GET() {
    const stats = getCacheStats();
    return Response.json({
      cache: {
        keys: stats.keys,
        hits: stats.stats.hits,
        misses: stats.stats.misses,
        hitRate: stats.stats.hits > 0
          ? ((stats.stats.hits / (stats.stats.hits + stats.stats.misses)) * 100)
            .toFixed(2) + "%"
          : "0%",
      },
      timestamp: new Date().toISOString(),
    });
  },
});
