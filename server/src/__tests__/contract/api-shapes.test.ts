import { describe, it, expect, afterAll } from "@jest/globals";
import { request, createTestUser, authHeader } from "../integration/setup";
import { prisma } from "../../utils/prisma";

/**
 * API Contract Tests — verify response shapes match expected schemas.
 */
describe("API Response Contracts", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: "contract@test.com" },
    });
  });

  it("Health check response follows standard format", async () => {
    const res = await request().get("/api/health").expect(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("status");
    expect(res.body.data).toHaveProperty("service");
    expect(res.body.data).toHaveProperty("version");
    expect(res.body.data).toHaveProperty("uptime");
    expect(res.body.data).toHaveProperty("timestamp");
  });

  it("Auth register response includes token and user", async () => {
    const res = await request()
      .post("/api/auth/register")
      .send({ username: "contract_test", email: "contract@test.com", password: "Contract1" })
      .expect(201);

    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data).toHaveProperty("user");
    expect(res.body.data.user).toHaveProperty("id");
    expect(res.body.data.user).toHaveProperty("email");
    expect(res.body.data.user).toHaveProperty("role");
  });

  it("Auth login response matches register shape", async () => {
    const { email, password } = await createTestUser();
    const res = await request()
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data).toHaveProperty("user");
    expect(typeof res.body.data.token).toBe("string");
  });

  it("Error responses include code and message", async () => {
    const res = await request().get("/api/auth/me").expect(401);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.error).toHaveProperty("code");
    expect(res.body.error).toHaveProperty("message");
    expect(res.body.error.code).toMatch(/^A\d{4}$/);
  });

  it("404 responses follow error format", async () => {
    const res = await request().get("/api/nonexistent-route").expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBeDefined();
  });

  it("Products response includes pagination meta", async () => {
    const res = await request().get("/api/products").expect(200);
    expect(res.body.meta).toHaveProperty("page");
    expect(res.body.meta).toHaveProperty("pageSize");
    expect(res.body.meta).toHaveProperty("total");
    expect(res.body.meta).toHaveProperty("totalPages");
  });

  it("Auth /me response does NOT include password", async () => {
    const { token } = await createTestUser();
    const res = await request()
      .get("/api/auth/me")
      .set(authHeader(token))
      .expect(200);

    expect(res.body.data).not.toHaveProperty("password");
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("email");
  });
});
