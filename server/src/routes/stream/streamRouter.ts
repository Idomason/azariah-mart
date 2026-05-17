import { Router } from "express";
import type { Router as ExpressRouter } from "express-serve-static-core";
import { createStreamToken } from "./streamController";

const router: ExpressRouter = Router();

router.route("/token").get(createStreamToken);

export default router;
