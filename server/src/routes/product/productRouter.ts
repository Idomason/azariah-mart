import { Router } from "express";
import {
  getAllProducts,
  getCategories,
  getSingleProduct,
} from "./productController";

const router: ReturnType<typeof Router> = Router();

router.route("/").get(getAllProducts);
router.route("/categories").get(getCategories);
router.route("/:slug").get(getSingleProduct);

export default router;
