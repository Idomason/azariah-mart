import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { getLocalUser } from "../../lib/users";

export const me = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await getLocalUser(userId);

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user info:", error);
    next(error);
  }
};
