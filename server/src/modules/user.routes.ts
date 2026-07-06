import { Router } from "express";
import { addressSchema } from "../shared";
import { userAddressService } from "../services/user-address.service";
import { ApiResponse } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.put("/me", async (req: AuthRequest, res, next) => {
  try {
    const user = await userAddressService.updateProfile(req.user!.id, req.body);
    return ApiResponse.ok(res, user);
  } catch (e) { next(e); }
});

router.get("/me/addresses", async (req: AuthRequest, res, next) => {
  try {
    const addresses = await userAddressService.listAddresses(req.user!.id);
    return ApiResponse.ok(res, addresses);
  } catch (e) { next(e); }
});

router.post("/me/addresses", async (req: AuthRequest, res, next) => {
  try {
    const parsed = addressSchema.safeParse(req.body);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const address = await userAddressService.createAddress(req.user!.id, parsed.data);
    return ApiResponse.created(res, address);
  } catch (e) { next(e); }
});

router.put("/me/addresses/:id", async (req: AuthRequest, res, next) => {
  try {
    const parsed = addressSchema.partial().safeParse(req.body);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const address = await userAddressService.updateAddress(req.user!.id, req.params.id, parsed.data);
    return ApiResponse.ok(res, address);
  } catch (e) { next(e); }
});

router.delete("/me/addresses/:id", async (req: AuthRequest, res, next) => {
  try {
    const result = await userAddressService.deleteAddress(req.user!.id, req.params.id);
    return ApiResponse.ok(res, result);
  } catch (e) { next(e); }
});

router.put("/me/addresses/:id/default", async (req: AuthRequest, res, next) => {
  try {
    const address = await userAddressService.setDefaultAddress(req.user!.id, req.params.id);
    return ApiResponse.ok(res, address);
  } catch (e) { next(e); }
});

export default router;

