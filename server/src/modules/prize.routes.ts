import { Router } from "express";
import { ApiResponse } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { prizeService } from "../services/prize.service";

const router = Router();
router.use(authMiddleware);

router.get("/my", async (req: AuthRequest, res, next) => {
  try { const data = await prizeService.getMyPrizes(req.user!.id); return ApiResponse.ok(res, data); } catch (e) { next(e); }
});
router.get("/", async (req: AuthRequest, res, next) => {
  try { const prizes = await prizeService.userPrizes(req.user!.id); return ApiResponse.ok(res, prizes); } catch (e) { next(e); }
});
router.post("/:id/claim", async (req: AuthRequest, res, next) => {
  try { const prize = await prizeService.claim(req.user!.id, req.params.id); return ApiResponse.ok(res, prize); } catch (e) { next(e); }
});
router.get("/active", async (_req: AuthRequest, res, next) => {
  try { const prizes = await prizeService.allActive(); return ApiResponse.ok(res, prizes); } catch (e) { next(e); }
});

export default router;
