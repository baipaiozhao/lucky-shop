import { Router } from "express";
import { gameStartSchema, gameFinishSchema } from "../validators";
import { gameService } from "../services/game.service";
import { ApiResponse } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// GET /api/games
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const lobby = await gameService.getLobby(req.user!.id);
    return ApiResponse.ok(res, lobby);
  } catch (e) { next(e); }
});

// POST /api/games/:type/start
router.post("/:type/start", async (req: AuthRequest, res, next) => {
  try {
    const parsed = gameStartSchema.safeParse(req.body);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const result = await gameService.startGame(req.user!.id, req.params.type, parsed.data.difficulty, parsed.data.orderId);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

// POST /api/games/:type/finish
router.post("/:type/finish", async (req: AuthRequest, res, next) => {
  try {
    const parsed = gameFinishSchema.safeParse(req.body);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const result = await gameService.finishGame(req.user!.id, parsed.data);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

// GET /api/games/history
router.get("/history", async (req: AuthRequest, res, next) => {
  try {
    const history = await gameService.getHistory(req.user!.id);
    return ApiResponse.ok(res, history);
  } catch (e) { next(e); }
});

export default router;
