import type { NextFunction, Request, Response } from "express";
import { getEnv } from "../../lib/env";
import { clerkClient, getAuth } from "@clerk/express";
import { getLocalUser } from "../../lib/users";
import {
  getStreamChatServer,
  streamChatDisplayName,
  streamUserId,
} from "../../lib/stream";

const env = getEnv();

export const createStreamToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const localUser = await getLocalUser(userId);

    if (!localUser) {
      return res.status(503).json({ error: "Account not synced yet" });
    }

    const streamServer = getStreamChatServer(env);

    const clerkUser = await clerkClient.users.getUser(userId);

    const combined =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      null;

    const name = streamChatDisplayName(
      localUser.role,
      localUser.displayName ?? combined ?? clerkUser.username,
      localUser.email,
    );

    const image = clerkUser.imageUrl || undefined;
    const sid = streamUserId(userId);

    await streamServer.upsertUser({ id: sid, name, image });

    const token = streamServer.createToken(sid);

    res.status(200).json({ token, apiKey: env.STREAM_API_KEY, userId: sid });
  } catch (error) {
    console.error("Error creating stream token:", error);
    next(error);
  }
};
