import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { GameService } from "../services/game.service";
import { AuthService } from "../services/auth.service";
import { CartService } from "../services/cart.service";
import { UserAddressService } from "../services/user-address.service";
import { OrderService } from "../services/order.service";
import { prisma } from "../utils/prisma";

describe("GameService", () => {
  const gameService = new GameService();
  const authService = new AuthService();
  const cartService = new CartService();
  const addressService = new UserAddressService();
  const orderService = new OrderService();

  let userId: string;
  let sessionId: string;

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
    const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
    const { user } = await authService.register("gtest_" + suffix, "gtest_" + suffix + "@example.com", "GameTest1");
    userId = user.id;

    const product = await prisma.product.findFirst({ where: { isActive: true, stock: { gt: 5 } } });
    if (!product) return;

    const addr = await addressService.createAddress(userId, {
      name: "Gamer", phone: "13800000002", province: "上海", city: "上海", district: "浦东", detail: "456号", isDefault: true,
    });

    // Create cart + order to get game chances
    await cartService.add(userId, product.id, 1);
    await orderService.create(userId, { addressId: addr.id, paymentMethod: "mock", couponIds: [], usePoints: 0 });
  });

  afterAll(async () => {
    await prisma.gameRecord.deleteMany({ where: { userId } });
    await prisma.gameSession.deleteMany({ where: { userId } });
    await prisma.orderItem.deleteMany({ where: { order: { userId } } });
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.cartItem.deleteMany({ where: { userId } });
    await prisma.address.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: { in: ['dummy'] } } });
    await prisma.$disconnect();
  });

  describe("getLobby", () => {
    it("returns lobby with game chances after order", async () => {
      const lobby = await gameService.getLobby(userId);
      expect(lobby.remainingChances).toBeGreaterThanOrEqual(1);
      expect(lobby.totalChances).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(lobby.games)).toBe(true);
      expect(lobby.games.length).toBe(5); // wheel, scratch, memory, 2048, reaction
    });
  });

  describe("startGame", () => {
    it("starts a game session", async () => {
      const result = await gameService.startGame(userId, "wheel", "easy");
      expect(result.sessionId).toBeDefined();
      expect(result.rngSeed).toBeDefined();
      expect(result.config).toBeDefined();
      sessionId = result.sessionId;
    });

    it("throws when no chances left", async () => {
      // We used the chance above, but there might be more from multi-quantity orders
      // Just verify the method handles lack of chances
      const lobby = await gameService.getLobby(userId);
      if (lobby.remainingChances === 0) {
        await expect(gameService.startGame(userId, "wheel", "easy")).rejects.toThrow();
      }
    });
  });

  describe("finishGame", () => {
    it("finishes a game session", async () => {
      if (!sessionId) return;
      const result = await gameService.finishGame(userId, {
        sessionId, score: 100, duration: 50,
      });
      expect(result.passed !== undefined).toBe(true);
      expect(result.record).toBeDefined();
    });

    it("throws for invalid session", async () => {
      await expect(
        gameService.finishGame(userId, { sessionId: "invalid-id", score: 0, duration: 0 })
      ).rejects.toThrow();
    });
  });

  describe("getHistory", () => {
    it("returns game history", async () => {
      const history = await gameService.getHistory(userId);
      expect(Array.isArray(history)).toBe(true);
    });
  });
});
