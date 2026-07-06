import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { CartService } from "../services/cart.service";
import { AuthService } from "../services/auth.service";
import { prisma } from "../utils/prisma";

describe("CartService", () => {
  const cartService = new CartService();
  const authService = new AuthService();
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
    const { user } = await authService.register("carttest", "cart_test@example.com", "CartTest123");
    userId = user.id;
    const product = await prisma.product.findFirst();
    productId = product?.id || "";
  });

  afterAll(async () => {
    await prisma.cartItem.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: "cart_test@example.com" } });
    await prisma.$disconnect();
  });

  describe("list", () => {
    it("returns empty cart for new user", async () => {
      const result = await cartService.list(userId);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta.itemCount).toBe(0);
    });
  });

  describe("add", () => {
    it("adds item to cart", async () => {
      if (!productId) return;
      const item = await cartService.add(userId, productId, 2);
      expect(item.productId).toBe(productId);
      expect(item.quantity).toBe(2);
    });

    it("increments quantity on duplicate add", async () => {
      if (!productId) return;
      const item = await cartService.add(userId, productId, 1);
      expect(item.quantity).toBe(3);
    });

    it("throws notFound for nonexistent product", async () => {
      await expect(cartService.add(userId, "bad-product", 1)).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("updates selected state", async () => {
      if (!productId) return;
      const result = await cartService.list(userId);
      const item = result.data[0];
      if (item) {
        const updated = await cartService.update(userId, item.id, { selected: false });
        expect((updated as any).selected).toBe(false);
      }
    });

    it("updates quantity", async () => {
      if (!productId) return;
      const result = await cartService.list(userId);
      const item = result.data[0];
      if (item) {
        const updated = await cartService.update(userId, item.id, { quantity: 1 });
        expect((updated as any).quantity).toBe(1);
      }
    });

    it("throws notFound for wrong user", async () => {
      await expect(cartService.update("bad-user", "bad-item", { quantity: 1 })).rejects.toThrow();
    });
  });

  describe("removeItem", () => {
    it("throws notFound for nonexistent item", async () => {
      await expect(cartService.removeItem(userId, "bad-item")).rejects.toThrow();
    });
  });

  describe("clear", () => {
    it("clears cart", async () => {
      const result = await cartService.clear(userId);
      expect(result.message).toBeDefined();
      const list = await cartService.list(userId);
      expect(list.data.length).toBe(0);
    });
  });
});
