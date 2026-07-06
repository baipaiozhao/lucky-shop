import { Router } from "express";
import { createOrderSchema } from "../validators";
import { orderService } from "../services/order.service";
import { ApiResponse } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// POST /api/orders/preview
router.post("/preview", async (req: AuthRequest, res, next) => {
  try {
    const { items, usePoints = 0 } = req.body;
    if (!items || !items.length) return ApiResponse.error(res, 400, "A4002", "购物车为空");
    const result = await orderService.preview(req.user!.id, items, usePoints);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

// POST /api/orders
router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const order = await orderService.create(req.user!.id, { ...parsed.data, couponIds: parsed.data.couponIds ?? [] });
    return ApiResponse.created(res, order);
  } catch (e) { next(e); }
});

// GET /api/orders
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const status = req.query.status as string | undefined;
    const result = await orderService.list(req.user!.id, page, pageSize, status);
    return ApiResponse.ok(res, result.data, undefined, result.meta);
  } catch (e) { next(e); }
});

// GET /api/orders/:id
router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const order = await orderService.getById(req.params.id, req.user!.id);
    return ApiResponse.ok(res, order);
  } catch (e) { next(e); }
});

// PUT /api/orders/:id/cancel
router.put("/:id/cancel", async (req: AuthRequest, res, next) => {
  try {
    const order = await orderService.cancel(req.params.id, req.user!.id, req.body.reason);
    return ApiResponse.ok(res, order);
  } catch (e) { next(e); }
});

// POST /api/orders/:id/confirm
router.post("/:id/confirm", async (req: AuthRequest, res, next) => {
  try {
    const order = await orderService.confirm(req.params.id, req.user!.id);
    return ApiResponse.ok(res, order);
  } catch (e) { next(e); }
});

export default router;

