import { prisma, serializeProduct } from "../utils/prisma";
import { BaseService } from "./base.service";

export class FavoriteService extends BaseService {
  async list(userId: string, page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);
    return { data: items.map(function(item) { return { ...item, product: item.product ? serializeProduct(item.product as any) : null }; }), meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async add(userId: string, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) this.notFound("商品不存在");
    const existing = await prisma.favorite.findUnique({ where: { userId_productId: { userId, productId } } });
    if (existing) return existing;
    return prisma.favorite.create({ data: { userId, productId } });
  }

  async remove(userId: string, productId: string) {
    await prisma.favorite.deleteMany({ where: { userId, productId } });
    return { message: "已取消收藏" };
  }
}

export const favoriteService = new FavoriteService();
