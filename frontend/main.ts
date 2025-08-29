import { App, staticFiles } from "fresh";
import { type State } from "./utils.ts";
import {
  createLogger,
  enhancedRequestIdMiddleware,
} from "./lib/middleware/request-id.ts";

export const app = new App<State>();

app.use(staticFiles());
app.use(enhancedRequestIdMiddleware);

// Pass a shared value from a middleware and create logger
app.use(async (ctx) => {
  ctx.state.shared = "hello";
  ctx.state.logger = createLogger(ctx.state.requestId);
  return await ctx.next();
});

// Include file-system based routes here
app.fsRoutes();
