import { Router } from "express";
import type { Router as ExpressRouter } from "express-serve-static-core";
import { me } from "./meController";

const router: ExpressRouter = Router();

router.route("/").get(me);

export default router;
