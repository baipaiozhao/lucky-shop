import { describe, it, expect } from "@jest/globals";
import { request, createTestUser, authHeader } from "./setup";

describe("Products API (integration)", () => {
  it("GET /api/products — returns paginated products", async () => {
    const res = await request().get("/api/products").expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
  });

  it("GET /api/products/featured — returns featured products", async () => {
    const res = await request().get("/api/products/featured").expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/products/categories — returns categories", async () => {
    const res = await request().get("/api/products/categories").expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0].name).toBeDefined();
    }
  });

  it("GET /api/products/hot — returns hot products", async () => {
    const res = await request().get("/api/products/hot").expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/products/new — returns new products", async () => {
    const res = await request().get("/api/products/new").expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/products/search/suggestions — returns suggestions", async () => {
    const res = await request()
      .get("/api/products/search/suggestions")
      .query({ keyword: "test" })
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/products/:id — returns 404 for nonexistent", async () => {
    await request().get("/api/products/nonexistent-id-12345").expect(404);
  });
});

describe("Order API (integration)", () => {
  it("POST /api/orders/preview — requires auth", async () => {
    await request().post("/api/orders/preview").send({ items: [], usePoints: 0 }).expect(401);
  });

  it("POST /api/orders/preview — rejects empty cart", async () => {
    const { token } = await createTestUser();
    await request()
      .post("/api/orders/preview")
      .set(authHeader(token))
      .send({ items: [], usePoints: 0 })
      .expect(400);
  });

  it("POST /api/orders — requires auth", async () => {
    await request().post("/api/orders").send({ addressId: "test" }).expect(401);
  });

  it("GET /api/orders — requires auth", async () => {
    await request().get("/api/orders").expect(401);
  });
});

describe("Cart API (integration)", () => {
  it("GET /api/cart — requires auth", async () => {
    await request().get("/api/cart").expect(401);
  });

  it("POST /api/cart — requires auth", async () => {
    await request().post("/api/cart").send({ productId: "test", quantity: 1 }).expect(401);
  });
});

describe("Health API (integration)", () => {
  it("GET /api/health — returns ok", async () => {
    const res = await request().get("/api/health").expect(200);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.service).toBe("lucky-shop-server");
  });

  it("GET /api/health/ready — returns ready", async () => {
    const res = await request().get("/api/health/ready").expect(200);
    expect(res.body.data.ready).toBe(true);
  });
});

describe("Games API (integration)", () => {
  it("GET /api/games — requires auth", async () => {
    await request().get("/api/games").expect(401);
  });

  it("POST /api/games/:type/start — requires auth", async () => {
    await request().post("/api/games/wheel/start").send({}).expect(401);
  });
});
