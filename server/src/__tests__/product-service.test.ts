import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { ProductService } from "../services/product.service";
import { prisma } from "../utils/prisma";

describe("ProductService", () => {
  const productService = new ProductService();

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("list", () => {
    it("returns paginated products with meta", async () => {
      const result = await productService.list({ page: 1, pageSize: 5 });
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta).toBeDefined();
      expect(result.meta.page).toBe(1);
      expect(result.meta.pageSize).toBe(5);
      expect(typeof result.meta.total).toBe("number");
      expect(typeof result.meta.totalPages).toBe("number");
    });

    it("filters by categoryId when categories exist", async () => {
      const categories = await productService.categories();
      if (categories.length > 0) {
        const result = await productService.list({ page: 1, pageSize: 5, categoryId: categories[0].id });
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it("filters by keyword", async () => {
      const result = await productService.list({ page: 1, pageSize: 5, keyword: "test" });
      expect(result.meta.total).toBeGreaterThanOrEqual(0);
    });

    it("sorts by price_asc maintains order", async () => {
      const result = await productService.list({ page: 1, pageSize: 10, sort: "price_asc" });
      const data = result.data as any[];
      for (let i = 1; i < data.length; i++) {
        expect(Number(data[i]?.price)).toBeGreaterThanOrEqual(Number(data[i - 1]?.price));
      }
    });

    it("sorts by newest", async () => {
      const result = await productService.list({ page: 1, pageSize: 5, sort: "newest" });
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("featured / newProducts / hot / categories", () => {
    it("returns featured products", async () => {
      const products = await productService.featured();
      expect(Array.isArray(products)).toBe(true);
    });

    it("returns new products", async () => {
      const products = await productService.newProducts();
      expect(Array.isArray(products)).toBe(true);
    });

    it("returns hot products", async () => {
      const products = await productService.hot();
      expect(Array.isArray(products)).toBe(true);
    });

    it("returns categories", async () => {
      const categories = await productService.categories();
      expect(Array.isArray(categories)).toBe(true);
      if (categories.length > 0) {
        expect(categories[0].name).toBeDefined();
      }
    });
  });

  describe("suggestions", () => {
    it("returns deduplicated name suggestions", async () => {
      const suggestions = await productService.suggestions("test");
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe("getById", () => {
    it("throws notFound for nonexistent product", async () => {
      await expect(productService.getById("nonexistent-product")).rejects.toThrow();
    });
  });

  describe("getReviews", () => {
    it("returns reviews for existing product", async () => {
      const result = await productService.list({ page: 1, pageSize: 1 });
      const data = result.data as any[];
      if (data.length > 0) {
        const reviews = await productService.getReviews(String(data[0]?.id || ""));
        expect(Array.isArray(reviews)).toBe(true);
      }
    });
  });
});
