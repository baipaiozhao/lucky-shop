import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { FavoriteService } from "../services/favorite.service";
import { AuthService } from "../services/auth.service";
import { prisma } from "../utils/prisma";

describe("FavoriteService", () => {
  const favoriteService = new FavoriteService();
  const authService = new AuthService();
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
    const { user } = await authService.register("favtest", "fav_test@example.com", "FavTest123");
    userId = user.id;

    // Get a real product id from DB
    const product = await prisma.product.findFirst();
    productId = product?.id || "";
  });

  afterAll(async () => {
    await prisma.favorite.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: "fav_test@example.com" } });
    await prisma.$disconnect();
  });

  describe("add", () => {
    it("adds a product to favorites", async () => {
      if (!productId) return;
      const fav = await favoriteService.add(userId, productId);
      expect(fav.productId).toBe(productId);
      expect(fav.userId).toBe(userId);
    });

    it("returns existing favorite without error", async () => {
      if (!productId) return;
      const fav = await favoriteService.add(userId, productId);
      expect(fav.productId).toBe(productId);
    });

    it("throws notFound for nonexistent product", async () => {
      await expect(favoriteService.add(userId, "nonexistent-product")).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("returns paginated favorites", async () => {
      const result = await favoriteService.list(userId, 1, 10);
      expect(result.data).toBeDefined();
      expect(result.meta.totalPages).toBeDefined();
    });
  });

  describe("remove", () => {
    it("removes a favorite", async () => {
      if (!productId) return;
      const result = await favoriteService.remove(userId, productId);
      expect(result.message).toBeDefined();
    });

    it("remove nonexistent is idempotent", async () => {
      const result = await favoriteService.remove(userId, "nonexistent-product");
      expect(result.message).toBeDefined();
    });
  });
});
