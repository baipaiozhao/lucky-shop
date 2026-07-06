import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { InviteService } from "../services/invite.service";
import { AuthService } from "../services/auth.service";
import { prisma } from "../utils/prisma";

describe("InviteService", () => {
  const inviteService = new InviteService();
  const authService = new AuthService();
  let user1Id: string, user2Id: string;

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
    const u1 = await authService.register("invt1", "inv1_test@example.com", "InvTest123");
    const u2 = await authService.register("invt2", "inv2_test@example.com", "InvTest123");
    user1Id = u1.user.id;
    user2Id = u2.user.id;
  });

  afterAll(async () => {
    await prisma.invitation.deleteMany({ where: { inviterId: { in: [user1Id, user2Id] } } });
    await prisma.user.deleteMany({ where: { email: { in: ["inv1_test@example.com", "inv2_test@example.com"] } } });
    await prisma.$disconnect();
  });

  describe("getOrCreateCode", () => {
    it("creates a new invite code", async () => {
      const result = await inviteService.getOrCreateCode(user1Id);
      expect(result.code).toBeDefined();
      expect(result.code.length).toBe(8);
    });

    it("returns same code on second call", async () => {
      const r1 = await inviteService.getOrCreateCode(user1Id);
      const r2 = await inviteService.getOrCreateCode(user1Id);
      expect(r1.code).toBe(r2.code);
    });
  });

  describe("listInvites", () => {
    it("returns invites and stats", async () => {
      const result = await inviteService.listInvites(user1Id);
      expect(result.invites).toBeDefined();
      expect(typeof result.stats.totalSent).toBe("number");
      expect(typeof result.stats.totalRegistered).toBe("number");
    });
  });

  describe("applyCode", () => {
    it("applies invite code", async () => {
      const { code } = await inviteService.getOrCreateCode(user1Id);
      const result = await inviteService.applyCode(user2Id, code);
      expect(result.message).toBeDefined();
    });

    it("rejects already used code", async () => {
      const { code } = await inviteService.getOrCreateCode(user1Id);
      // The code was already used above, so this should throw
      await expect(inviteService.applyCode(user2Id, code)).rejects.toThrow();
    });

    it("rejects self-invite", async () => {
      // Create new code after previous was consumed
      await prisma.invitation.updateMany({ where: { inviterId: user1Id }, data: { status: "pending", inviteeId: null } });
      const { code } = await inviteService.getOrCreateCode(user1Id);
      await expect(inviteService.applyCode(user1Id, code)).rejects.toThrow();
    });

    it("rejects nonexistent code", async () => {
      await expect(inviteService.applyCode(user2Id, "BADC0DE0")).rejects.toThrow();
    });
  });

  describe("leaderboard", () => {
    it("returns leaderboard array", async () => {
      const lb = await inviteService.leaderboard();
      expect(Array.isArray(lb)).toBe(true);
    });
  });
});
