import express from "express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { sdk } from "./_core/sdk";
import { publishScheduledNote } from "./db";
import { deleteHeartbeatJob } from "./_core/heartbeat";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

export function createApiApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "4mb" }));
  app.use(express.urlencoded({ limit: "256kb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/publish-note", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      await publishScheduledNote(user.taskUid);
      await deleteHeartbeatJob(user.taskUid, "").catch(error => console.warn("[Schedule] Could not remove one-time job:", error));
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ error: "scheduled publish failed" });
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );
  return app;
}
