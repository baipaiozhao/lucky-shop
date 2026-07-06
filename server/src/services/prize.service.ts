import { prisma } from "../utils/prisma";
import { BaseService } from "./base.service";

export class PrizeService extends BaseService {
  async userPrizes(userId: string) {
    return prisma.userPrize.findMany({
      where: { userId },
      include: { prize: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getMyPrizes(userId: string) {
    const [user, userPrizes, userCoupons, gameHistory] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { points: true } }),
      prisma.userPrize.findMany({
        where: { userId, prize: { type: "gift" } },
        include: { prize: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.userCoupon.findMany({
        where: { userId },
        include: { coupon: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.gameRecord.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return {
      points: { balance: user?.points || 0 },
      gifts: userPrizes.map((up) => ({
        id: up.id,
        name: up.prize?.name || "实物奖品",
        status: up.status,
        createdAt: up.createdAt,
      })),
      coupons: userCoupons.map((uc) => ({
        id: uc.id,
        name: uc.coupon?.name || "优惠券",
        minSpend: uc.coupon?.minSpend || 0,
        expiredAt: uc.expiredAt,
        status: uc.status,
      })),
      gameHistory: gameHistory.map((gr) => ({
        id: gr.id,
        gameType: gr.gameType,
        difficulty: gr.difficulty,
        passed: gr.passed,
        score: gr.score,
        createdAt: gr.createdAt,
      })),
    };
  }

  async claim(userId: string, prizeId: string) {
    const userPrize = await prisma.userPrize.findFirst({
      where: { id: prizeId, userId },
    });
    if (!userPrize) this.notFound("奖品不存在");
    if (userPrize.status !== "unclaimed") this.badRequest("奖品已领取或已过期", "A4002");
    return prisma.userPrize.update({ where: { id: userPrize.id }, data: { status: "claimed", claimedAt: new Date() } });
  }

  async allActive() {
    return prisma.prize.findMany({ where: { isActive: true }, orderBy: { sort: "asc" } });
  }
}

export const prizeService = new PrizeService();

