import { createApp } from "../../app";
import type { Application } from "express";
import supertest from "supertest";
import { prisma } from "../../utils/prisma";

let app: Application;

beforeAll(async () => {
  app = createApp();
  await prisma.$queryRaw`SELECT 1`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

export function request(): supertest.SuperAgentTest {
  return supertest.agent(app) as unknown as supertest.SuperAgentTest;
}

export async function createTestUser(overrides: {
  username?: string;
  email?: string;
  password?: string;
} = {}) {
  const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  const data = {
    username: overrides.username || ("testuser_" + suffix),
    email: overrides.email || ("test_" + suffix + "@example.com"),
    password: overrides.password || "TestPass1",
  };

  const res = await request()
    .post("/api/auth/register")
    .send(data)
    .expect(201);

  return {
    user: res.body.data.user,
    token: res.body.data.token,
    ...data,
  };
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
