import { prisma } from "../utils/prisma";
import type { Prize } from "@prisma/client";

/**
 * Game reward logic — separated from game session management.
 */
export class GameRewardService {
  async pickPrizeWithFallback(tier: string): Promise<Prize | null> {
    const tiers = ["hard", "medium", "easy"];
    const startIdx = tiers.indexOf(tier);

    for (let i = startIdx; i < tiers.length; i++) {
      const prizes = await prisma.prize.findMany({
        where: { tier: tiers[i], stock: { gt: 0 }, isActive: true },
      });
      if (prizes.length > 0) return this.pickPrize(prizes);
    }
    return prisma.prize.findFirst({ where: { tier: "consolation" } }) || null;
  }

  private pickPrize(prizes: Prize[]): Prize {
    const totalWeight = prizes.reduce((s, p) => s + Number(p.probability), 0);
    let random = Math.random() * totalWeight;
    for (const prize of prizes) {
      random -= Number(prize.probability);
      if (random <= 0) return prize;
    }
    return prizes[prizes.length - 1];
  }

  async applyReward(
    tx: any,
    userId: string,
    sessionId: string,
    orderId: string,
    gameType: string,
    difficulty: string,
    passed: boolean,
    score: number,
    duration: number,
  ) {
    const record = await tx.gameRecord.create({
      data: { userId, sessionId, gameType, difficulty, score, duration, passed },
    });

    let prize: Prize | null = null;

    if (passed) {
      prize = await this.pickPrizeWithFallback(difficulty);
      if (prize) {
        if (prize.type === "points") {
          await tx.pointsTransaction.create({
            data: { userId, amount: Number(prize.value), type: "earned", source: "game", remark: "prize: " + prize.name },
          });
          await tx.user.update({ where: { id: userId }, data: { points: { increment: Number(prize.value) } } });
          if (prize.stock > 0) {
            await tx.prize.update({ where: { id: prize.id }, data: { stock: { decrement: 1 } } });
          }
        } else if (prize.type === "coupon") {
          // 通过奖品名称匹配对应的优惠券模板
          const templates = await tx.coupon.findMany({
            where: {
              name: prize.name,
              isActive: true,
            },
          });
          if (templates.length > 0) {
            for (const c of templates) {
              await tx.userCoupon.create({
                data: {
                  userId,
                  couponId: c.id,
                  status: "unused",
                  expiredAt: new Date(Date.now() + c.validDays * 24 * 60 * 60 * 1000),
                },
              });
            }
          } else {
            // 如果没有找到匹配名称的优惠券，尝试通过金额匹配
            const fallbackCoupon = await tx.coupon.findFirst({
              where: {
                amount: prize.value,
                isActive: true,
              },
            });
            if (fallbackCoupon) {
              await tx.userCoupon.create({
                data: {
                  userId,
                  couponId: fallbackCoupon.id,
                  status: "unused",
                  expiredAt: new Date(Date.now() + fallbackCoupon.validDays * 24 * 60 * 60 * 1000),
                },
              });
            }
          }
        } else if (prize.type === "gift") {
          await tx.userPrize.create({
            data: { userId, prizeId: prize.id, gameRecordId: record.id, status: "unclaimed", expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
          });
        }
      }
    } else {
      await tx.pointsTransaction.create({
        data: { userId, amount: 10, type: "earned", source: "game", remark: "participation" },
      });
      await tx.user.update({ where: { id: userId }, data: { points: { increment: 10 } } });
    }

    return { record, prize };
  }
}

export const gameRewardService = new GameRewardService();
