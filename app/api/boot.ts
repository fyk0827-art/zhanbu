import "dotenv/config";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { appRouter } from "./router";
import { createContext } from "./context";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Detect if we're running from dist/boot.js (production) or api/boot.ts (dev)
const isRunningFromDist = __dirname.endsWith("dist") || __dirname.includes("dist/");
const distPath = isRunningFromDist
  ? path.resolve(__dirname, "public")        // dist/boot.js → dist/public
  : path.resolve(__dirname, "../dist/public"); // api/boot.ts → dist/public

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// OAuth callback
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// tRPC API endpoint
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// 404 for unmatched API routes
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

// Production: serve static files
if (process.env.NODE_ENV === "production") {
  console.log("[server] Static files root:", distPath);
  console.log("[server] Static files exist:", fs.existsSync(distPath));

  // Serve static assets
  app.use("/assets/*", serveStatic({ root: distPath }));

  // Serve index.html for all non-API routes (SPA fallback)
  app.get("*", (c) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      return c.html(fs.readFileSync(indexPath, "utf-8"));
    }
    return c.json({ error: "Not Found" }, 404);
  });
}

export default app;

if (process.env.NODE_ENV === "production") {
  const { serve } = await import("@hono/node-server");
  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
