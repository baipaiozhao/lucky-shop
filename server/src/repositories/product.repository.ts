import { Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository";

export class ProductRepository extends BaseRepository {
  findById(id: string) {
    return this.db.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  findMany(where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput[], skip: number, take: number) {
    return this.db.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { category: { select: { name: true } } },
    });
  }

  count(where: Prisma.ProductWhereInput) {
    return this.db.product.count({ where });
  }

  findFeatured(limit = 8) {
    return this.db.product.findMany({
      where: { isFeatured: true, isActive: true },
      orderBy: [{ sort: "asc" }, { sales: "desc" }],
      take: limit,
    });
  }

  findNew(limit = 8) {
    return this.db.product.findMany({
      where: { isNew: true, isActive: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  findHot(limit = 8) {
    return this.db.product.findMany({
      where: { isActive: true },
      orderBy: { sales: "desc" },
      take: limit,
    });
  }

  findCategories() {
    return this.db.category.findMany({
      where: { isActive: true },
      orderBy: { sort: "asc" },
    });
  }

  searchNames(keyword: string, limit = 10) {
    return this.db.product.findMany({
      where: { name: { contains: keyword }, isActive: true },
      select: { name: true },
      take: limit,
    });
  }

  decrementStock(id: string, qty: number) {
    return this.db.product.updateMany({
      where: { id, stock: { gte: qty } },
      data: { stock: { decrement: qty }, sales: { increment: qty } },
    });
  }

  updateRating(id: string, rating: number) {
    return this.db.product.update({
      where: { id },
      data: { rating, reviewCount: { increment: 1 } },
    });
  }
}

export const productRepository = new ProductRepository();
