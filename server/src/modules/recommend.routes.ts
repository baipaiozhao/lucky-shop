import { Router } from "express";
import { prisma } from "../utils/prisma";
import { ApiResponse } from "../utils/response";

const router = Router();

// GET /api/recommend/:id/related
router.get("/:id/related", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return ApiResponse.error(res, 404, "A2001", "商品不存在");

    let related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: req.params.id }, isActive: true },
      orderBy: [{ sales: "desc" }, { rating: "desc" }],
      take: 4,
    });

    if (related.length < 4) {
      const more = await prisma.product.findMany({
        where: { id: { notIn: [req.params.id, ...related.map((p) => p.id)] }, isActive: true },
        orderBy: { sales: "desc" },
        take: 4 - related.length,
      });
      related = [...related, ...more];
    }

    return ApiResponse.ok(res, related);
  } catch (e) { next(e); }
});

export default router;
