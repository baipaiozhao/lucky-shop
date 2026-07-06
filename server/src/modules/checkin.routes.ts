import { Router } from "express";
import { ApiResponse } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { checkinService } from "../services/checkin.service";

const router = Router();
router.use(authMiddleware);

router.post("/", async (req: AuthRequest, res, next) => {
  try { const result = await checkinService.checkin(req.user!.id); return ApiResponse.ok(res, result); } catch (e) { next(e); }
});
router.get("/", async (req: AuthRequest, res, next) => {
  try { const stats = await checkinService.stats(req.user!.id); return ApiResponse.ok(res, stats); } catch (e) { next(e); }
});

// GET /api/checkin/today ? check if already checked in today
router.get("/today", async (req: AuthRequest, res, next) => {
  try { const todayStatus = await checkinService.getTodayStatus(req.user!.id); return ApiResponse.ok(res, todayStatus); } catch (e) { next(e); }
});

export default router;
