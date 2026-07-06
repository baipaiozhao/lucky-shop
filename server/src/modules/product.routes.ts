import { Router } from "express";
import { productQuerySchema } from "../shared";
import { productService } from "../services/product.service";
import { ApiResponse } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// GET /api/products
router.get("/", async (req, res, next) => {
  try {
    const parsed = productQuerySchema.safeParse(req.query);
    if (!parsed.success) return ApiResponse.error(res, 400, "A3001", "参数校验失败", parsed.error.flatten());
    const result = await productService.list(parsed.data);
    return ApiResponse.ok(res, result.data, undefined, result.meta);
  } catch (e) { next(e); }
});

// GET /api/products/featured
router.get("/featured", async (_req, res, next) => {
  try {
    const products = await productService.featured();
    return ApiResponse.ok(res, products);
  } catch (e) { next(e); }
});

// GET /api/products/new
router.get("/new", async (_req, res, next) => {
  try {
    const products = await productService.newProducts();
    return ApiResponse.ok(res, products);
  } catch (e) { next(e); }
});

// GET /api/products/hot
router.get("/hot", async (_req, res, next) => {
  try {
    const products = await productService.hot();
    return ApiResponse.ok(res, products);
  } catch (e) { next(e); }
});

// GET /api/products/categories
router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await productService.categories();
    return ApiResponse.ok(res, categories);
  } catch (e) { next(e); }
});

// GET /api/products/search/suggestions
router.get("/search/suggestions", async (req, res, next) => {
  try {
    const { keyword } = req.query;
    if (!keyword || typeof keyword !== "string") return ApiResponse.ok(res, []);
    const suggestions = await productService.suggestions(keyword);
    return ApiResponse.ok(res, suggestions);
  } catch (e) { next(e); }
});

// GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.id);
    return ApiResponse.ok(res, product);
  } catch (e) { next(e); }
});

// GET /api/products/:id/reviews
router.get("/:id/reviews", async (req, res, next) => {
  try {
    const reviews = await productService.getReviews(req.params.id);
    return ApiResponse.ok(res, reviews);
  } catch (e) { next(e); }
});

// POST /api/products/:id/reviews
router.post("/:id/reviews", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { rating, content, images, isAnonymous, orderId } = req.body;
    if (!rating || !content) return ApiResponse.error(res, 400, "A3002", "缺少评分或内容");
    const review = await productService.addReview({
      userId: req.user!.id,
      productId: req.params.id,
      orderId,
      rating,
      content,
      images,
      isAnonymous,
    });
    return ApiResponse.created(res, review);
  } catch (e) { next(e); }
});

export default router;

