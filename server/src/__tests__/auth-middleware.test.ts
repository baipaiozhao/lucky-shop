import { describe, it, expect, jest, beforeAll, afterAll } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import { prisma } from "../utils/prisma";
import { AuthService } from "../services/auth.service";

describe("authMiddleware", () => {
  const authService = new AuthService();

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: "middleware_test@example.com" } });
    await prisma.$disconnect();
  });

  function mockReqRes(authHeader?: string) {
    let nextErr: Error | null = null;
    const req = {
      headers: { authorization: authHeader || "" },
      user: undefined,
    } as unknown as AuthRequest;
    const res = {} as Response;
    const next: NextFunction = ((err?: unknown) => {
      if (err instanceof Error) nextErr = err;
    }) as NextFunction;
    const getNextError = () => nextErr;
    return { req, res, next, getNextError };
  }

  it("rejects missing Authorization header", async () => {
    const { req, res, next, getNextError } = mockReqRes();
    await authMiddleware(req, res, next);
    expect(getNextError()).toBeDefined();
    expect((getNextError() as any).code).toBe("A1001");
  });

  it("rejects non-Bearer token", async () => {
    const { req, res, next, getNextError } = mockReqRes("Basic dGVzdDp0ZXN0");
    await authMiddleware(req, res, next);
    expect((getNextError() as any).code).toBe("A1001");
  });

  it("rejects invalid JWT", async () => {
    const { req, res, next, getNextError } = mockReqRes("Bearer invalid.token.here");
    await authMiddleware(req, res, next);
    expect((getNextError() as any).code).toBe("A1002");
  });

  it("rejects expired JWT", async () => {
    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ id: "fake", email: "x", role: "user" }, "wrong-secret", { expiresIn: "1ms" });
    // Wait for token to expire
    await new Promise(r => setTimeout(r, 5));
    const { req, res, next, getNextError } = mockReqRes(`Bearer ${token}`);
    await authMiddleware(req, res, next);
    expect((getNextError() as any).code).toBe("A1002");
  });

  it("accepts valid token and sets req.user", async () => {
    const { token, user } = await authService.register("mwtest", "middleware_test@example.com", "MwTest123");
    const { req, res, next, getNextError } = mockReqRes(`Bearer ${token}`);
    await authMiddleware(req, res, next);
    expect(getNextError()).toBeNull();
    expect(req.user).toBeDefined();
    expect(req.user!.id).toBe(user.id);
  });

  it("rejects token for deleted user", async () => {
    const { token } = await authService.register("mwdel", "mw_del@example.com", "MwDel123");
    await prisma.user.delete({ where: { email: "mw_del@example.com" } });
    const { req, res, next, getNextError } = mockReqRes(`Bearer ${token}`);
    await authMiddleware(req, res, next);
    expect((getNextError() as any).code).toBe("A1003");
  });
});

describe("adminMiddleware", () => {
  function mockAdminReq(role: string) {
    let nextErr: Error | null = null;
    const req = { user: { id: "1", email: "a", role } } as AuthRequest;
    const res = {} as Response;
    const next: NextFunction = ((err?: unknown) => {
      if (err instanceof Error) nextErr = err;
    }) as NextFunction;
    return { req, res, next, getNextError: () => nextErr };
  }

  it("rejects non-admin user", () => {
    const { req, res, next, getNextError } = mockAdminReq("user");
    adminMiddleware(req, res, next);
    expect((getNextError() as any).code).toBe("A1008");
  });

  it("accepts admin user", () => {
    const { req, res, next, getNextError } = mockAdminReq("admin");
    adminMiddleware(req, res, next);
    expect(getNextError()).toBeNull();
  });

  it("rejects missing user (undefined)", () => {
    const { req, res, next, getNextError } = mockAdminReq("user");
    req.user = undefined;
    adminMiddleware(req, res, next);
    expect((getNextError() as any).code).toBe("A1008");
  });
});
