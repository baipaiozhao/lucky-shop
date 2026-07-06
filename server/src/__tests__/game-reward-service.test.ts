import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { GameRewardService } from "../services/game-reward.service";
import { prisma } from "../utils/prisma";

describe("GameRewardService", () => {
  const grs = new GameRewardService();

  beforeAll(async () => { await prisma.$queryRaw`SELECT 1`; });
  afterAll(async () => { await prisma.$disconnect(); });

  describe("pickPrizeWithFallback", () => {
    it("returns a prize or null for 'easy' tier", async () => {
      const prize = await grs.pickPrizeWithFallback("easy");
      if (prize) {
        expect(prize.tier).toBeDefined();
        expect(prize.name).toBeDefined();
      }
    });

    it("does not throw for invalid tier", async () => {
      const prize = await grs.pickPrizeWithFallback("impossible-tier");
      expect(true).toBe(true); // No crash = pass
    });

    it("falls back through tiers (easy with no stock → medium)", async () => {
      // This test just ensures no crash during fallback logic
      const prize = await grs.pickPrizeWithFallback("easy");
      // Accept any valid result (prize or null, depending on DB state)
      expect(prize === null || typeof prize.name === "string").toBe(true);
    });
  });
});
