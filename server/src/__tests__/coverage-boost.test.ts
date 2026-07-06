import { describe, it, expect } from "@jest/globals";
import { request, createTestUser, authHeader } from "./integration/setup";

describe("Quick Coverage Boost - Integration", () => {
  it("GET /api/health/ready returns ready", async () => {
    const res = await request().get("/api/health/ready").expect(200);
    expect(res.body.data.ready).toBe(true);
  });

  it("GET /api/csrf-token returns token", async () => {
    const res = await request().get("/api/csrf-token").expect(200);
    expect(res.body.data.csrfToken).toBeDefined();
  });

  it("POST /api/auth/register validates weak password", async () => {
    await request()
      .post("/api/auth/register")
      .send({ username: "weakpw", email: "weak@example.com", password: "short" })
      .expect(400);
  });

  it("GET /api/users/me requires auth", async () => {
    await request().get("/api/users/me").expect(401);
  });

  it("GET /api/checkin/stats requires auth", async () => {
    await request().get("/api/checkin/stats").expect(401);
  });

  it("GET /api/products/search/suggestions with keyword", async () => {
    const res = await request()
      .get("/api/products/search/suggestions")
      .query({ keyword: "phone" })
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("DELETE /api/favorites/:id requires auth", async () => {
    await request().delete("/api/favorites/some-id").expect(401);
  });

  it("POST /api/auth/forgot-password requires email", async () => {
    await request()
      .post("/api/auth/forgot-password")
      .send({})
      .expect(400);
  });

  it("POST /api/auth/reset-password requires params", async () => {
    await request()
      .post("/api/auth/reset-password")
      .send({})
      .expect(400);
  });

  it("GET /api/prizes requires auth", async () => {
    const { token } = await createTestUser();
    const res = await request()
      .get("/api/prizes")
      .set(authHeader(token))
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/invites/leaderboard requires auth", async () => {
    await request().get("/api/invites/leaderboard").expect(401);
  });
});
