import type { Request, Response, NextFunction } from "express";
import { db } from "../../databases";
import { products } from "../../databases/schema";
import { and, desc, eq } from "drizzle-orm";

export const getAllProducts = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const cat =
      typeof req.query.category === "string" ? req.query.category.trim() : "";

    const activeOnly = eq(products.active, true);
    const whereClause = cat
      ? and(activeOnly, eq(products.category, cat))
      : activeOnly;

    const rows = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt));

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching product info:", error);
    next(error);
  }
};

export const getCategories = async function (
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rows = await db
      .select({ category: products.category })
      .from(products)
      .where(eq(products.active, true))
      .groupBy(products.category);

    const categories = [...new Set(rows.map((row) => row.category))].sort(
      (a, b) => a.localeCompare(b),
    );
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    next(error);
  }
};

export const getSingleProduct = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const slug = req.params.slug as string;

    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!row || !row.active) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product: row });
  } catch (error) {
    console.error("Error fetching product info:", error);
    next(error);
  }
};
