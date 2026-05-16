import { Router } from "express";
import { me } from "./meController";

const router = Router();

router.route("/").get(me);

export default router;
