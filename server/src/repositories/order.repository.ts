import { Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository";

export class OrderRepository extends BaseRepository {
  findCartByUser(userId: string, selectedOnly = false) {
    const where: Prisma.CartItemWhereInput = { userId };
    if (selectedOnly) where.selected = true;
    return this.db.cartItem.findMany({
      where,
      include: { product: true },
    });
  }

  findAddress(id: string) {
    return this.db.address.findUnique({ where: { id } });
  }

  findUserCoupons(userId: string) {
    return this.db.userCoupon.findMany({
      where: { userId, status: "unused", expiredAt: { gt: new Date() } },
      include: { coupon: true },
    });
  }

  findOrdersByUser(userId: string, page: number, pageSize: number, status?: string) {
    const where: Prisma.OrderWhereInput = { userId };
    if (status && status !== "all") where.status = status;
    return Promise.all([
      this.db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: { select: { productName: true, productImage: true, price: true, quantity: true } },
        },
      }),
      this.db.order.count({ where }),
    ]);
  }

  findOrderById(id: string, userId: string) {
    return this.db.order.findFirst({
      where: { id, userId },
      include: { address: true, items: true },
    });
  }

  updateOrder(id: string, data: Prisma.OrderUpdateInput) {
    return this.db.order.update({ where: { id }, data });
  }

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.db.$transaction(fn);
  }
}

export const orderRepository = new OrderRepository();
