import { prisma } from "../utils/prisma";
import { BaseService } from "./base.service";

export class AdminService extends BaseService {
  async dashboard() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      todayOrders, totalUsers, totalProducts, totalOrders, gameStats, couponStats,
      recentOrders, topProducts, inviteStats, conversionRate,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: todayStart }, status: { not: "cancelled" } } }),
      prisma.user.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.gameRecord.groupBy({ by: ["passed"], _count: true, where: { createdAt: { gte: todayStart } } }),
      prisma.userCoupon.groupBy({ by: ["status"], _count: true }),
      prisma.order.findMany({ where: { createdAt: { gte: todayStart } }, orderBy: { createdAt: "desc" }, take: 5, include: { items: { select: { productName: true, quantity: true } } } }),
      prisma.product.findMany({ where: { isActive: true }, orderBy: { sales: "desc" }, take: 5, select: { name: true, sales: true, stock: true } }),
      prisma.invitation.groupBy({ by: ["status"], _count: true }),
      prisma.analyticsEvent.count({ where: { event: "page_view", createdAt: { gte: todayStart } } }),
    ]);

    const todayRevenue = await prisma.order.aggregate({
      where: { createdAt: { gte: todayStart }, status: "paid" },
      _sum: { finalAmount: true },
    });

    return {
      stats: {
        todayOrders,
        todayRevenue: Number(todayRevenue._sum.finalAmount || 0),
        totalUsers, totalProducts, totalOrders,
        todayGamesPlayed: gameStats.reduce((a, b) => a + b._count, 0),
        todayGamesWon: gameStats.find((g) => g.passed)?._count || 0,
        activeCoupons: couponStats.find((c) => c.status === "unused")?._count || 0,
        totalInvites: inviteStats.reduce((a, b) => a + b._count, 0),
        registeredInvites: inviteStats.find((s) => s.status === "registered")?._count || 0,
        todayPageViews: conversionRate,
        conversionRate: todayOrders > 0 && conversionRate > 0 ? ((todayOrders / conversionRate) * 100).toFixed(1) + "%" : "N/A",
      },
      recentOrders, topProducts,
    };
  }

  async listProducts(page: number, pageSize: number) {
    const [products, total] = await Promise.all([
      prisma.product.findMany({ skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" }, include: { category: { select: { name: true } } } }),
      prisma.product.count(),
    ]);
    return { data: products, meta: { page, pageSize, total } };
  }

  async createProduct(data: { name: string; description: string; price: number; originalPrice?: number; categoryId: string; stock: number; images?: string[]; isFeatured?: boolean; isNew?: boolean }) {
    const { images = [], ...rest } = data;
    return prisma.product.create({ data: { ...rest, images: JSON.stringify(images) } as any });
  }

  async updateProduct(id: string, data: Record<string, unknown>) {
    if (data.images) data.images = JSON.stringify(data.images);
    return prisma.product.update({ where: { id }, data });
  }

  async deleteProduct(id: string) {
    await prisma.product.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
    return { message: "已下架" };
  }

  async listOrders(page: number, pageSize: number, status?: string) {
    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { user: { select: { username: true } }, items: { select: { productName: true, quantity: true, price: true } } } }),
      prisma.order.count({ where }),
    ]);
    return { data: orders, meta: { page, pageSize, total } };
  }

  async updateOrder(id: string, data: { status?: string; trackingNo?: string; carrier?: string }) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.status === "shipped") updateData.shippedAt = new Date();
    return prisma.order.update({ where: { id }, data: updateData });
  }

  async listPrizes() {
    return prisma.prize.findMany({ orderBy: [{ tier: "asc" }, { sort: "asc" }] });
  }

  async restockPrize(id: string, stock: number) {
    return prisma.prize.update({ where: { id }, data: { stock } });
  }

  async listUsers() {
    return prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: "desc" }, take: 50,
    });
  }

  async updateUser(id: string, data: { role?: string; status?: string }) {
    return prisma.user.update({ where: { id }, data, select: { id: true, username: true, role: true, status: true } });
  }
}

export const adminService = new AdminService();

