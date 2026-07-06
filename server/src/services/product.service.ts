import { serializeProduct, serializeProducts } from "../database/connection";
import { productRepository } from "../repositories/product.repository";
import { BaseService } from "./base.service";
import type { Prisma } from "@prisma/client";

export class ProductService extends BaseService {
  async list(params: {
    page: number;
    pageSize: number;
    categoryId?: string;
    keyword?: string;
    sort?: string;
  }) {
    const { page, pageSize, categoryId, keyword, sort } = params;
    const where: Prisma.ProductWhereInput = { isActive: true, deletedAt: null };

    if (categoryId) where.categoryId = categoryId;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    switch (sort) {
      case "price_asc":  orderBy.push({ price: "asc" }); break;
      case "price_desc": orderBy.push({ price: "desc" }); break;
      case "sales":      orderBy.push({ sales: "desc" }); break;
      case "newest":     orderBy.push({ createdAt: "desc" }); break;
      default:           orderBy.push({ sort: "asc" }); orderBy.push({ createdAt: "desc" });
    }

    const [products, total] = await Promise.all([
      productRepository.findMany(where, orderBy, (page - 1) * pageSize, pageSize),
      productRepository.count(where),
    ]);

    return {
      data: serializeProducts(products as any),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async featured() {
    return productRepository.findFeatured().then(serializeProducts);
  }

  async newProducts() {
    return productRepository.findNew().then(serializeProducts);
  }

  async hot() {
    return productRepository.findHot().then(serializeProducts);
  }

  async categories() {
    return productRepository.findCategories();
  }

  async suggestions(keyword: string) {
    const products = await productRepository.searchNames(keyword);
    return [...new Set(products.map((p) => p.name))];
  }

  async getById(id: string) {
    const product = await productRepository.findById(id);
    if (!product || !product.isActive) {
      this.notFound("商品不存在或已下架");
    }
    return serializeProduct(product as any);
  }

  async getReviews(productId: string) {
    const { prisma } = await import("../utils/prisma");
    return prisma.review.findMany({
      where: { productId },
      include: { user: { select: { username: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  async addReview(params: {
    userId: string;
    productId: string;
    orderId: string;
    rating: number;
    content: string;
    images?: string[];
    isAnonymous?: boolean;
  }) {
    const { prisma } = await import("../utils/prisma");
    const { userId, productId, orderId, rating, content, images, isAnonymous } = params;

    if (rating < 1 || rating > 5) this.badRequest("评分必须为 1-5", "A3003");

    const orderItem = await prisma.orderItem.findFirst({
      where: { productId, orderId },
      include: { order: true },
    });

    if (
      !orderItem ||
      orderItem.order.userId !== userId ||
      orderItem.order.status !== "completed"
    ) {
      this.forbidden("仅已完成的订单可评价");
    }

    const existing = await prisma.review.findFirst({
      where: { userId, orderId, productId },
    });
    if (existing) this.conflict("已评价过该商品", "A1002");

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        orderId,
        rating,
        content,
        images: images ? JSON.stringify(images) : null,
        isAnonymous: isAnonymous || false,
      },
      include: { user: { select: { username: true, avatar: true } } },
    });

    const allReviews = await prisma.review.findMany({ where: { productId } });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await productRepository.updateRating(productId, Math.round(avgRating * 10) / 10);

    return review;
  }
}

export const productService = new ProductService();
