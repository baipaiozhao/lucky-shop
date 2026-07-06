/**
 * 统一 Zod Schema 汇聚 — 所有 validator 从此导出
 * 目标：消除路由文件中散落的 schema 定义
 */
import { z } from "zod";

// ===== 页码分页 =====
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

// ===== 订单 =====
export const createOrderSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.string().default("mock"),
  couponIds: z.array(z.string()).optional(),
  usePoints: z.coerce.number().int().min(0).optional().default(0),
});

export const orderStatusSchema = z.enum([
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
]);

// ===== 游戏 =====
export const gameStartSchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  orderId: z.string().optional(),
});

export const gameFinishSchema = z.object({
  sessionId: z.string().min(1),
  score: z.number().int().min(0),
  duration: z.number().int().min(0),
  clientNonce: z.string().optional(),
  moves: z.number().int().min(0).optional(),
  hash: z.string().optional(),
});

// ===== 邀请/分享 =====
export const shareSchema = z.object({
  type: z.enum(["game_result", "product", "achievement"]),
  refId: z.string().min(1),
  channel: z.string().optional(),
});

// ===== 管理后台 =====
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  categoryId: z.string().min(1),
  stock: z.number().int().min(0),
  images: z.array(z.string().url()).min(1),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// ===== 搜索 =====
export const searchSchema = z.object({
  keyword: z.string().min(1).max(100),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  sort: z.enum(["price_asc", "price_desc", "sales", "newest"]).optional(),
});
