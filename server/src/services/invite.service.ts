import { prisma } from "../utils/prisma";
import { nanoid } from "nanoid";
import { BaseService } from "./base.service";

export class InviteService extends BaseService {
  async listInvites(userId: string) {
    const [invites, stats] = await Promise.all([
      prisma.invitation.findMany({
        where: { inviterId: userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.invitation.count({
        where: { inviterId: userId, status: "registered" },
      }),
    ]);

    return {
      invites,
      stats: {
        totalSent: invites.length,
        totalRegistered: stats,
        totalRewarded: invites.filter((i) => i.rewardGiven).length,
      },
    };
  }

  async getOrCreateCode(userId: string) {
    let invite = await prisma.invitation.findFirst({
      where: { inviterId: userId, status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    if (!invite) {
      const code = nanoid(8);
      invite = await prisma.invitation.create({
        data: { inviterId: userId, code, status: "pending" },
      });
    }

    return { code: invite.code, createdAt: invite.createdAt };
  }

  async applyCode(userId: string, code: string) {
    const invite = await prisma.invitation.findUnique({ where: { code } });
    if (!invite) this.notFound("邀请码无效");
    if (invite.status !== "pending") this.badRequest("邀请码已使用或过期", "A4002");
    if (invite.inviterId === userId) this.badRequest("不能邀请自己", "A4003");

    const existing = await prisma.invitation.findUnique({
      where: { inviteeId: userId },
    });
    if (existing) this.conflict("已被邀请过", "A2002");

    await prisma.$transaction([
      prisma.invitation.update({
        where: { id: invite.id },
        data: { inviteeId: userId, status: "registered", completedAt: new Date() },
      }),
      prisma.pointsTransaction.create({
        data: {
          userId: invite.inviterId,
          amount: 100,
          type: "earned",
          source: "invite",
          remark: "邀请好友注册奖励",
        },
      }),
      prisma.user.update({
        where: { id: invite.inviterId },
        data: { points: { increment: 100 } },
      }),
    ]);

    return { message: "邀请码使用成功" };
  }

  async leaderboard() {
    const topInvites = await prisma.invitation.groupBy({
      by: ["inviterId"],
      where: { status: "registered" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const userIds = topInvites.map((i) => i.inviterId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, avatar: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return topInvites.map((entry) => ({
      username: userMap.get(entry.inviterId)?.username || "未知用户",
      count: entry._count.id,
    }));
  }
}

export const inviteService = new InviteService();
