import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:4000/api";

test.describe("LuckyShop E2E Smoke Tests", () => {
  test("Health endpoint returns ok", async ({ request }) => {
    const res = await request.get(`${API_BASE}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("ok");
    expect(body.data.service).toBe("lucky-shop-server");
  });

  test("Readiness endpoint returns ready", async ({ request }) => {
    const res = await request.get(`${API_BASE}/health/ready`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.ready).toBe(true);
  });

  test("Products endpoint returns paginated data", async ({ request }) => {
    const res = await request.get(`${API_BASE}/products`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(typeof body.meta.total).toBe("number");
  });

  test("Categories endpoint returns list", async ({ request }) => {
    const res = await request.get(`${API_BASE}/products/categories`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("Register + login flow", async ({ request }) => {
    const email = `e2e_${Date.now()}@test.com`;
    const password = "E2eTest123";

    // Register
    const regRes = await request.post(`${API_BASE}/auth/register`, {
      data: { username: `eu_${Date.now()}`, email, password },
    });
    expect(regRes.status()).toBe(201);
    const regBody = await regRes.json();
    expect(regBody.data.token).toBeDefined();
    const token = regBody.data.token;

    // Login
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password },
    });
    expect(loginRes.status()).toBe(200);

    // Me
    const meRes = await request.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meRes.status()).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.data.email).toBe(email);
  });

  test("Unauthenticated access returns 401", async ({ request }) => {
    const res = await request.get(`${API_BASE}/auth/me`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toMatch(/^A\d{4}$/);
  });

  test("404 for nonexistent route", async ({ request }) => {
    const res = await request.get(`${API_BASE}/nonexistent`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
