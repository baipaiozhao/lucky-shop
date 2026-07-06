import { Router } from "express";
import { shareSchema } from "../validators";
import { inviteService } from "../services/invite.service";
import { ApiResponse } from "../utils/response";
import { prisma } from "../utils/prisma";
import type { AuthRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// GET /api/invites
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const result = await inviteService.listInvites(req.user!.id);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

// GET /api/invites/my-code
router.get("/my-code", async (req: AuthRequest, res, next) => {
  try {
    const result = await inviteService.getOrCreateCode(req.user!.id);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

// POST /api/invites/apply
router.post("/apply", async (req: AuthRequest, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return ApiResponse.error(res, 400, "A3002", "缺少邀请码");
    const result = await inviteService.applyCode(req.user!.id, code);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

// GET /api/invites/stats
router.get("/stats", async (_req: AuthRequest, res, next) => {
  try {
    const leaderboard = await inviteService.leaderboard();
    return ApiResponse.ok(res, leaderboard);
  } catch (e) { next(e); }
});

// POST /api/shares
router.post("/shares", async (req: AuthRequest, res, next) => {
  try {
    const parsed = shareSchema.safeParse(req.body);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const share = await prisma.shareRecord.create({
      data: { userId: req.user!.id, type: parsed.data.type, refId: parsed.data.refId, channel: parsed.data.channel },
    });
    return ApiResponse.created(res, share);
  } catch (e) { next(e); }
});

export default router;

