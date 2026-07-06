import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { PrizeService } from "../services/prize.service";
import { prisma } from "../utils/prisma";

describe("PrizeService", () => {
  const prizeService = new PrizeService();

  beforeAll(async () => { await prisma.$queryRaw`SELECT 1`; });
  afterAll(async () => { await prisma.$disconnect(); });

  describe("allActive", () => {
    it("returns active prizes", async () => {
      const prizes = await prizeService.allActive();
      expect(Array.isArray(prizes)).toBe(true);
    });
  });

  describe("userPrizes", () => {
    it("returns empty for user with no prizes", async () => {
      const prizes = await prizeService.userPrizes("nonexistent-user-id");
      expect(Array.isArray(prizes)).toBe(true);
      expect(prizes.length).toBe(0);
    });
  });

  describe("claim", () => {
    it("throws notFound for nonexistent prize", async () => {
      await expect(prizeService.claim("user-x", "prize-x")).rejects.toThrow();
    });
  });
});
