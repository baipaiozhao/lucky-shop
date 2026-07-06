import { prisma } from "../utils/prisma";
import { BaseService } from "./base.service";

export class CheckinService extends BaseService {
  async checkin(userId: string) {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const existing = await prisma.checkIn.findFirst({
      where: { userId, checkDate: { gte: todayDate, lt: new Date(todayDate.getTime() + 86400000) } },
    });
    if (existing) this.conflict("今日已签到", "A4002");

    const prevCheckins = await prisma.checkIn.findMany({
      where: { userId },
      orderBy: { checkDate: "desc" },
      take: 1,
    });

    let dayIndex = 1;
    if (prevCheckins.length > 0) {
      const prevDate = new Date(prevCheckins[0].checkDate);
      const yesterday = new Date(todayDate.getTime() - 86400000);
      if (prevDate.toDateString() === yesterday.toDateString()) {
        dayIndex = prevCheckins[0].dayIndex + 1;
      }
    }

    const reward = this.getCheckinReward(dayIndex);
    const [checkin] = await prisma.$transaction([
      prisma.checkIn.create({ data: { userId, checkDate: todayDate, dayIndex, reward: JSON.stringify(reward), points: reward.value } }),
      prisma.user.update({ where: { id: userId }, data: { points: { increment: reward.value } } }),
      prisma.pointsTransaction.create({
        data: { userId, amount: reward.value, type: "earned", source: "checkin", remark: reward.message },
      }),
    ]);

    return { dayIndex, reward, checkin };
  }

  async getTodayStatus(userId: string) {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const existing = await prisma.checkIn.findFirst({
      where: { userId, checkDate: { gte: todayDate, lt: new Date(todayDate.getTime() + 86400000) } },
    });
    return { checked: !!existing };
  }

  async stats(userId: string) {
    const checkins = await prisma.checkIn.findMany({ where: { userId }, orderBy: { checkDate: "desc" }, take: 30 });
    return { total: checkins.length, streak: this.calcStreak(checkins), checkins };
  }

  private getCheckinReward(dayIndex: number): { type: string; value: number; message: string } {
    if (dayIndex >= 30) return { type: "points", value: 100, message: "连续30天签到，额外奖励100积分" };
    if (dayIndex >= 7) return { type: "points", value: 30, message: "连续7天签到，额外奖励30积分" };
    return { type: "points", value: 5, message: "签到成功 +5积分" };
  }

  private calcStreak(checkins: { checkDate: Date }[]): number {
    if (!checkins.length) return 0;
    let streak = 1;
    for (let i = 1; i < checkins.length; i++) {
      const diff = new Date(checkins[i - 1].checkDate).getTime() - new Date(checkins[i].checkDate).getTime();
      if (Math.abs(diff - 86400000) < 3600000) streak++;
      else break;
    }
    return streak;
  }
}

export const checkinService = new CheckinService();
