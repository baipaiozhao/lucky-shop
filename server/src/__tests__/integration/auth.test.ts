import { describe, it, expect, afterAll } from "@jest/globals";
import { request, createTestUser, authHeader } from "./setup";
import { prisma } from "../../utils/prisma";

describe("Auth API (integration)", () => {
  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["alice@test.com", "bob@test.com"],
        },
      },
    });
  });

  it("POST /api/auth/register — creates a new user", async () => {
    const res = await request()
      .post("/api/auth/register")
      .send({ username: "alice", email: "alice@test.com", password: "Alice1234" })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("alice@test.com");
  });

  it("POST /api/auth/register — rejects duplicate email", async () => {
    await request()
      .post("/api/auth/register")
      .send({ username: "bob1", email: "bob@test.com", password: "Bob12345" })
      .expect(201);

    await request()
      .post("/api/auth/register")
      .send({ username: "bob2", email: "bob@test.com", password: "Bob12345" })
      .expect(409);
  });

  it("POST /api/auth/login — returns token for valid credentials", async () => {
    const { token, email, password } = await createTestUser();
    const res = await request()
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
  });

  it("POST /api/auth/login — rejects wrong password", async () => {
    const { email } = await createTestUser();
    await request()
      .post("/api/auth/login")
      .send({ email, password: "WrongPass1" })
      .expect(401);
  });

  it("GET /api/auth/me — returns current user", async () => {
    const { token, user } = await createTestUser();
    const res = await request()
      .get("/api/auth/me")
      .set(authHeader(token))
      .expect(200);

    expect(res.body.data.id).toBe(user.id);
  });

  it("GET /api/auth/me — rejects without token", async () => {
    await request().get("/api/auth/me").expect(401);
  });

  it("POST /api/auth/logout — returns ok", async () => {
    const { token } = await createTestUser();
    await request()
      .post("/api/auth/logout")
      .set(authHeader(token))
      .expect(200);
  });
});
