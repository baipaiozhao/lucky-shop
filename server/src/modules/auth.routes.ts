import { Router } from "express";
import { registerSchema, loginSchema, changePasswordSchema, passwordSchema } from "../shared";
import { authService } from "../services/auth.service";
import type { AuthRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";
import { ApiResponse } from "../utils/response";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const result = await authService.register(parsed.data.username, parsed.data.email, parsed.data.password);
    return ApiResponse.created(res, result);
  } catch (e) { next(e); }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const result = await authService.login(parsed.data.email, parsed.data.password);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

// POST /api/auth/logout
router.post("/logout", authMiddleware, (_req, res) => {
  return ApiResponse.ok(res, { message: "已登出" });
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await authService.getProfile(req.user!.id);
    return ApiResponse.ok(res, user);
  } catch (e) { next(e); }
});

// POST /api/auth/change-password
router.post("/change-password", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const result = await authService.changePassword(req.user!.id, parsed.data.oldPassword, parsed.data.newPassword);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return ApiResponse.error(res, 400, "A3002", "缺少邮箱参数");
    const result = await authService.forgotPassword(email);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return ApiResponse.error(res, 400, "A3002", "缺少必要参数");
    const pwParsed = passwordSchema.safeParse(newPassword);
    if (!pwParsed.success) return ApiResponse.error(res, 400, "A3003", "密码不符合要求", pwParsed.error.flatten());
    const result = await authService.resetPassword(resetToken, pwParsed.data);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

export default router;

