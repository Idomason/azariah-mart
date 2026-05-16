import { Router } from "express";
import { createStreamToken } from "./streamController";

const router: ReturnType<typeof Router> = Router();

router.route("/token").get(createStreamToken);

export default router;
