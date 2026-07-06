import { Router } from "express";
import { cartService } from "../services/cart.service";
import { ApiResponse } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";
import { z } from "zod";

const router = Router();
router.use(authMiddleware);

const addToCartSchema = z.object({ productId: z.string(), quantity: z.coerce.number().int().min(1).default(1) });
const updateCartSchema = z.object({ quantity: z.coerce.number().int().min(0).optional(), selected: z.boolean().optional() });

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const result = await cartService.list(req.user!.id);
    return ApiResponse.ok(res, result.data, undefined, result.meta);
  } catch (e) { next(e); }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const parsed = addToCartSchema.safeParse(req.body);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const result = await cartService.add(req.user!.id, parsed.data.productId, parsed.data.quantity);
    return ApiResponse.created(res, result);
  } catch (e) { next(e); }
});

router.patch("/:itemId", async (req: AuthRequest, res, next) => {
  try {
    const parsed = updateCartSchema.safeParse(req.body);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const result = await cartService.update(req.user!.id, req.params.itemId, parsed.data);
    if ("message" in result) return ApiResponse.ok(res, result);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

router.delete("/:itemId", async (req: AuthRequest, res, next) => {
  try {
    const result = await cartService.removeItem(req.user!.id, req.params.itemId);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

router.delete("/", async (req: AuthRequest, res, next) => {
  try {
    const result = await cartService.clear(req.user!.id);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

export default router;

