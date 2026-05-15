import "dotenv/config";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import express, { Request, Response } from "express";
import { clerkMiddleware } from "@clerk/express";
import { getEnv } from "./lib/env";
import { clerkWebhookHandler } from "./webhooks/clerk";

const env = getEnv();
const app = express();
const PORT = env.PORT || 8000;

const rawJson = express.raw({ type: "application/json", limit: "1mb" });

// It's important to use the raw body parser for webhook routes to verify signatures correctly
app.post("/webhooks/clerk", rawJson, (req: Request, res: Response) => {
  clerkWebhookHandler(req, res);
});

// Middlewares
app.use(cors({ origin: env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

const publicDir = path.join(process.cwd(), "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  app.get("/{*any}", (req: Request, res: Response, next: Function) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    if (req.path.startsWith("/api") || req.path.startsWith("/webhooks")) {
      next();
      return;
    }

    res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
  });
} else {
  console.warn("Public directory not found. Static files will not be served.");
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${env.NODE_ENV} mode.`);
});
