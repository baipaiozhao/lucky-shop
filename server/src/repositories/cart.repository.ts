import { prisma } from "../utils/prisma";
import { BaseRepository } from "./base.repository";

export class CartRepository extends BaseRepository {
  async findByUser(userId: string) {
    return this.db.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { updatedAt: "desc" },
    });
  }
  async findItemByUser(userId: string, itemId: string) {
    return this.db.cartItem.findFirst({
      where: { id: itemId, userId },
      include: { product: true },
    });
  }
  async findItem(userId: string, productId: string) {
    return this.db.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  }
  async create(userId: string, productId: string, quantity: number) {
    return this.db.cartItem.create({
      data: { userId, productId, quantity },
      include: { product: true },
    });
  }
  async updateQuantity(id: string, quantity: number) {
    return this.db.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: true },
    });
  }
  async updateSelected(id: string, selected: boolean) {
    return this.db.cartItem.update({
      where: { id },
      data: { selected },
      include: { product: true },
    });
  }
  async remove(id: string) {
    return this.db.cartItem.delete({ where: { id } });
  }
  async clear(userId: string) {
    return this.db.cartItem.deleteMany({ where: { userId } });
  }
}

export const cartRepository = new CartRepository();
