import { Router } from "express";
import { ApiResponse } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { favoriteService } from "../services/favorite.service";
import { prisma } from "../utils/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res, next) => {
  try { const page=Number(req.query.page)||1; const ps=Number(req.query.pageSize)||10; const r=await favoriteService.list(req.user!.id,page,ps); return ApiResponse.ok(res,r.data,undefined,r.meta); } catch (e) { next(e); }
});
router.get("/check/:productId", async (req: AuthRequest, res, next) => {
  try {
    const fav = await prisma.favorite.findUnique({
      where: { userId_productId: { userId: req.user!.id, productId: req.params.productId } }
    });
    return ApiResponse.ok(res, !!fav);
  } catch (e) { next(e); }
});
router.post("/", async (req: AuthRequest, res, next) => {
  try { const { productId }=req.body; if(!productId) return ApiResponse.error(res,400,"A3002","缺少商品ID"); const r=await favoriteService.add(req.user!.id,productId); return ApiResponse.created(res, r); } catch (e) { next(e); }
});
router.delete("/:productId", async (req: AuthRequest, res, next) => {
  try { const r=await favoriteService.remove(req.user!.id,req.params.productId); return ApiResponse.ok(res,r); } catch (e) { next(e); }
});

export default router;

