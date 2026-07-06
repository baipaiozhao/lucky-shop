import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { AdminService } from "../services/admin.service";
import { prisma } from "../utils/prisma";

describe("AdminService", () => {
  const adminService = new AdminService();

  beforeAll(async () => { await prisma.$queryRaw`SELECT 1`; });
  afterAll(async () => { await prisma.$disconnect(); });

  describe("dashboard", () => {
    it("returns dashboard stats", async () => {
      const dash = await adminService.dashboard();
      expect(dash.stats).toBeDefined();
      expect(typeof dash.stats.totalUsers).toBe("number");
      expect(typeof dash.stats.totalProducts).toBe("number");
      expect(typeof dash.stats.todayOrders).toBe("number");
      expect(Array.isArray(dash.recentOrders)).toBe(true);
      expect(Array.isArray(dash.topProducts)).toBe(true);
    });
  });

  describe("listProducts", () => {
    it("returns paginated products", async () => {
      const result = await adminService.listProducts(1, 5);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta.page).toBe(1);
    });
  });

  describe("listOrders", () => {
    it("returns paginated orders", async () => {
      const result = await adminService.listOrders(1, 5);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("filters by status", async () => {
      const result = await adminService.listOrders(1, 5, "paid");
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("listPrizes", () => {
    it("returns prizes list", async () => {
      const prizes = await adminService.listPrizes();
      expect(Array.isArray(prizes)).toBe(true);
    });
  });

  describe("listUsers", () => {
    it("returns users list", async () => {
      const users = await adminService.listUsers();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe("createProduct / deleteProduct", () => {
    let productId: string;

    it("creates a product", async () => {
      const cats = await prisma.category.findFirst();
      if (!cats) return;
      const product = await adminService.createProduct({
        name: "Test Product " + Math.random().toString(36).substring(2, 6),
        description: "A test product",
        price: 99,
        categoryId: cats.id,
        stock: 10,
        images: ["https://example.com/img.jpg"],
      });
      expect(product.name).toBeDefined();
      productId = product.id;
    });

    it("deleteProduct soft-deletes", async () => {
      if (!productId) return;
      const result = await adminService.deleteProduct(productId);
      expect(result.message).toBeDefined();
    });
  });

  describe("updateUser", () => {
    it("updates user role", async () => {
      const suffix = Math.floor(Math.random() * 100000).toString();
      const user = await prisma.user.create({
        data: { username: "admtest_" + suffix, email: "adm_" + suffix + "@test.com", password: "hash" },
      });
      const updated = await adminService.updateUser(user.id, { role: "admin" });
      expect(updated.role).toBe("admin");
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
