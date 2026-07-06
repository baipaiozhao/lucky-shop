import { Router } from "express";
import { adminService } from "../services/admin.service";
import { ApiResponse } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { z } from "zod";

const router = Router();
router.use(authMiddleware, adminMiddleware);

const createProductSchema = z.object({
  name: z.string().min(1).max(200), description: z.string().min(1).max(2000),
  price: z.coerce.number().positive(), originalPrice: z.coerce.number().positive().optional(),
  categoryId: z.string().min(1), stock: z.coerce.number().int().min(0),
  images: z.array(z.string()).optional().default([]), isFeatured: z.boolean().optional(), isNew: z.boolean().optional(),
});
const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(), description: z.string().min(1).max(2000).optional(),
  detail: z.string().optional(), price: z.coerce.number().positive().optional(),
  originalPrice: z.coerce.number().positive().optional(), categoryId: z.string().min(1).optional(),
  stock: z.coerce.number().int().min(0).optional(), images: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(), isNew: z.boolean().optional(),
  isActive: z.boolean().optional(), sort: z.number().int().optional(), tags: z.array(z.string()).optional(),
});
const updateOrderSchema = z.object({
  status: z.enum(["pending","paid","shipped","completed","cancelled","refunded"]).optional(),
  trackingNo: z.string().max(100).optional(), carrier: z.string().max(50).optional(),
});
const restockPrizeSchema = z.object({ stock: z.coerce.number().int().min(0).max(99999) });
const updateUserSchema = z.object({ role: z.enum(["user","admin"]).optional(), status: z.enum(["active","banned"]).optional() });

router.get("/dashboard", async (_req: AuthRequest, res, next) => {
  try { const result = await adminService.dashboard(); return ApiResponse.ok(res, result); } catch (e) { next(e); }
});
router.get("/products", async (req: AuthRequest, res, next) => {
  try { const page=Number(req.query.page)||1; const ps=Number(req.query.pageSize)||10; const r=await adminService.listProducts(page,ps); return ApiResponse.ok(res, r.data, undefined, r.meta); } catch (e) { next(e); }
});
router.post("/products", async (req: AuthRequest, res, next) => {
  try { const p=createProductSchema.safeParse(req.body); if(!p.success) return ApiResponse.error(res,400,"A3001","参数校验失败",p.error.flatten()); const r=await adminService.createProduct(p.data); return ApiResponse.created(res, r); } catch (e) { next(e); }
});
router.put("/products/:id", async (req: AuthRequest, res, next) => {
  try { const p=updateProductSchema.safeParse(req.body); if(!p.success) return ApiResponse.error(res,400,"A3001","参数校验失败",p.error.flatten()); const r=await adminService.updateProduct(req.params.id,{...p.data}); return ApiResponse.ok(res,r); } catch (e) { next(e); }
});
router.delete("/products/:id", async (req: AuthRequest, res, next) => {
  try { const r=await adminService.deleteProduct(req.params.id); return ApiResponse.ok(res,r); } catch (e) { next(e); }
});
router.get("/orders", async (req: AuthRequest, res, next) => {
  try { const page=Number(req.query.page)||1; const ps=Number(req.query.pageSize)||10; const s=req.query.status as string|undefined; const r=await adminService.listOrders(page,ps,s); return ApiResponse.ok(res,r.data,undefined,r.meta); } catch (e) { next(e); }
});
router.patch("/orders/:id", async (req: AuthRequest, res, next) => {
  try { const p=updateOrderSchema.safeParse(req.body); if(!p.success) return ApiResponse.error(res,400,"A3001","参数校验失败",p.error.flatten()); const r=await adminService.updateOrder(req.params.id,p.data); return ApiResponse.ok(res,r); } catch (e) { next(e); }
});
router.get("/prizes", async (_req: AuthRequest, res, next) => {
  try { const r=await adminService.listPrizes(); return ApiResponse.ok(res,r); } catch (e) { next(e); }
});
router.post("/prizes/:id/restock", async (req: AuthRequest, res, next) => {
  try { const p=restockPrizeSchema.safeParse(req.body); if(!p.success) return ApiResponse.error(res,400,"A3001","参数校验失败",p.error.flatten()); const r=await adminService.restockPrize(req.params.id,p.data.stock); return ApiResponse.ok(res,r); } catch (e) { next(e); }
});
router.get("/users", async (_req: AuthRequest, res, next) => {
  try { const r=await adminService.listUsers(); return ApiResponse.ok(res,r); } catch (e) { next(e); }
});
router.patch("/users/:id", async (req: AuthRequest, res, next) => {
  try { const p=updateUserSchema.safeParse(req.body); if(!p.success) return ApiResponse.error(res,400,"A3001","参数校验失败",p.error.flatten()); const r=await adminService.updateUser(req.params.id,p.data); return ApiResponse.ok(res,r); } catch (e) { next(e); }
});

export default router;

