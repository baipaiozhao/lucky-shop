import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { CheckinService } from "../services/checkin.service";
import { AuthService } from "../services/auth.service";
import { prisma } from "../utils/prisma";

describe("CheckinService", () => {
  const checkinService = new CheckinService();
  const authService = new AuthService();
  let userId: string;

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
    const { user } = await authService.register("cktest", "ck_test@example.com", "CkTest123");
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.checkIn.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: "ck_test@example.com" } });
    await prisma.$disconnect();
  });

  describe("checkin", () => {
    it("completes first checkin and returns reward", async () => {
      const result = await checkinService.checkin(userId);
      expect(result.dayIndex).toBe(1);
      expect(result.reward.type).toBe("points");
      expect(result.reward.value).toBe(5);
      expect(result.checkin).toBeDefined();
    });

    it("throws conflict on same-day double checkin", async () => {
      await expect(checkinService.checkin(userId)).rejects.toThrow();
    });
  });

  describe("stats", () => {
    it("returns stats for user", async () => {
      const stats = await checkinService.stats(userId);
      expect(stats.total).toBeGreaterThanOrEqual(1);
      expect(typeof stats.streak).toBe("number");
      expect(Array.isArray(stats.checkins)).toBe(true);
    });

    it("returns zero stats for new user", async () => {
      const stats = await checkinService.stats("nonexistent-user");
      expect(stats.total).toBe(0);
      expect(stats.streak).toBe(0);
    });
  });
});
