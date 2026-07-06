import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { OrderService } from "../services/order.service";
import { AuthService } from "../services/auth.service";
import { CartService } from "../services/cart.service";
import { UserAddressService } from "../services/user-address.service";
import { prisma } from "../utils/prisma";

describe("OrderService", () => {
  const orderService = new OrderService();
  const authService = new AuthService();
  const cartService = new CartService();
  const addressService = new UserAddressService();

  let userId: string;
  let addressId: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;

    // Create test user
    const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
    const { user } = await authService.register("ordertest_" + suffix, "order_" + suffix + "@example.com", "OrderTest1");
    userId = user.id;

    // Create address
    const addr = await addressService.createAddress(userId, {
      name: "Test User", phone: "13800000001", province: "北京", city: "北京", district: "朝阳", detail: "123号", isDefault: true,
    });
    addressId = addr.id;

    // Get a real product with stock
    const product = await prisma.product.findFirst({ where: { isActive: true, stock: { gt: 10 } } });
    productId = product?.id || "";

    // Add to cart
    if (productId) {
      await cartService.add(userId, productId, 2);
    }
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { order: { userId } } });
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.cartItem.deleteMany({ where: { userId } });
    await prisma.address.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe("preview", () => {
    it("previews order with cart items", async () => {
      if (!productId) return;
      const result = await orderService.preview(userId, [{ productId }], 0);
      expect(result.items.length).toBeGreaterThan(0);
      expect(typeof result.totalAmount).toBe("number");
      expect(typeof result.finalAmount).toBe("number");
      expect(typeof result.shippingFee).toBe("number");
    });

    it("previews with points deduction", async () => {
      if (!productId) return;
      const result = await orderService.preview(userId, [{ productId }], 50);
      expect(result.pointsUsed).toBeGreaterThanOrEqual(0);
    });

    it("rejects empty items", async () => {
      await expect(orderService.preview(userId, [], 0)).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("creates an order from cart", async () => {
      if (!productId || !addressId) return;
      const order = await orderService.create(userId, {
        addressId, paymentMethod: "mock", couponIds: [], usePoints: 0,
      });
      expect(order.orderNo).toBeDefined();
      expect(order.status).toBe("paid");
      expect(order.items.length).toBeGreaterThan(0);
      orderId = order.id;
    });
  });

  describe("list", () => {
    it("lists user orders with pagination", async () => {
      const result = await orderService.list(userId, 1, 10);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta.total).toBeGreaterThanOrEqual(1);
    });

    it("filters by status", async () => {
      const result = await orderService.list(userId, 1, 10, "paid");
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("getById", () => {
    it("returns order detail", async () => {
      if (!orderId) return;
      const order = await orderService.getById(orderId, userId);
      expect(order).toBeDefined();
      expect(order.orderNo).toBeDefined();
    });

    it("throws notFound for wrong user", async () => {
      await expect(orderService.getById(orderId || "x", "bad-user")).rejects.toThrow();
    });
  });

  describe("cancel", () => {
    it("rejects cancel of paid order", async () => {
      if (!orderId) return;
      await expect(orderService.cancel(orderId, userId)).rejects.toThrow();
    });
  });

  describe("confirm", () => {
    it("rejects confirm of paid order (not shipped)", async () => {
      if (!orderId) return;
      await expect(orderService.confirm(orderId, userId)).rejects.toThrow();
    });
  });
});
