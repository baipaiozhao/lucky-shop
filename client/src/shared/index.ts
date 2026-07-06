import { z } from "zod";

// Error Codes
export const ErrorCodes = {
  AUTH_TOKEN_MISSING: "A1001", AUTH_TOKEN_EXPIRED: "A1002", AUTH_TOKEN_INVALID: "A1003",
  AUTH_EMAIL_EXISTS: "A1004", AUTH_USERNAME_EXISTS: "A1005", AUTH_WRONG_PASSWORD: "A1006",
  AUTH_ACCOUNT_LOCKED: "A1007", AUTH_PERMISSION_DENIED: "A1008", AUTH_CSRF_INVALID: "A1009",
  RES_NOT_FOUND: "A2001", RES_ALREADY_EXISTS: "A2002",
  VAL_INVALID_PARAM: "A3001", VAL_MISSING_FIELD: "A3002", VAL_OUT_OF_RANGE: "A3003",
  BIZ_STOCK_INSUFFICIENT: "A4001", BIZ_CART_EMPTY: "A4002", BIZ_GAME_CHANCES_EXHAUSTED: "A4003",
  BIZ_PRIZE_STOCK_EMPTY: "A4004", BIZ_COUPON_EXPIRED: "A4005", BIZ_COUPON_MIN_SPEND: "A4006",
  BIZ_GAME_ALREADY_PLAYED: "A4007", BIZ_GAME_CHEAT_DETECTED: "A4008",
  BIZ_ORDER_ALREADY_PAID: "A4009", BIZ_PRODUCT_OFFLINE: "A4010", BIZ_DUPLICATE_REQUEST: "A4011",
  SYS_INTERNAL_ERROR: "A5001", SYS_RATE_LIMITED: "A5002", SYS_MAINTENANCE: "A5003",
} as const;
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Schemas
export const passwordSchema = z.string().min(8).max(50).regex(/[A-Z]/, "Need uppercase").regex(/[a-z]/, "Need lowercase").regex(/[0-9]/, "Need digit");
export const emailSchema = z.string().email();
export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/);
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(50) });
export const registerSchema = z.object({ username: z.string().min(2).max(20), email: emailSchema, password: passwordSchema });
export const changePasswordSchema = z.object({ oldPassword: z.string().min(1), newPassword: passwordSchema });
export const addressSchema = z.object({ name: z.string().min(1).max(50), phone: phoneSchema, province: z.string().min(1), city: z.string().min(1), district: z.string().min(1), detail: z.string().min(1).max(200), isDefault: z.boolean().optional() });
export const productQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(12), categoryId: z.string().optional(), keyword: z.string().optional(), sort: z.enum(["price_asc","price_desc","sales","newest"]).optional() });
export const orderStatuses = ["pending","paid","shipped","completed","cancelled","refunded"] as const;
export type OrderStatus = typeof orderStatuses[number];

// Response types
export interface ApiSuccess<T> { success: true; data: T; message?: string; meta?: Record<string, unknown>; }
export interface ApiError { success: false; error: { code: string; message: string; details?: unknown; }; }
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
export interface PaginationMeta { page: number; pageSize: number; total: number; totalPages: number; }

export { calcCouponDiscount, findBestCoupon } from "../../../shared/src/coupon";
