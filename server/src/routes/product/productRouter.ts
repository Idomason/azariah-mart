import { Router } from "express";
import type { Router as ExpressRouter } from "express-serve-static-core";
import {
  getAllProducts,
  getCategories,
  getSingleProduct,
} from "./productController";

const router: ExpressRouter = Router();

router.route("/").get(getAllProducts);
router.route("/categories").get(getCategories);
router.route("/:slug").get(getSingleProduct);

export default router;
