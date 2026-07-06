import { describe, it, expect } from "@jest/globals";
import { errorHandler, notFoundHandler } from "../middleware/error";
import { BusinessError } from "../utils/response";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

describe("notFoundHandler", () => {
  it("returns 404 with error format", () => {
    let statusCode = 200;
    let jsonBody: any = null;
    const req = { method: "GET", originalUrl: "/test" } as Request;
    const res = {
      status(code: number) { statusCode = code; return res; },
      json(data: any) { jsonBody = data; return res; },
    } as any;
    notFoundHandler(req, res as Response);
    expect(statusCode).toBe(404);
    expect(jsonBody.success).toBe(false);
    expect(jsonBody.error.code).toBe("A4040");
  });
});

describe("errorHandler", () => {
  function setup() {
    let statusCode = 200;
    let jsonBody: any = null;
    const req = { method: "GET", originalUrl: "/test" } as Request;
    const res = {
      status(code: number) { statusCode = code; return res; },
      json(data: any) { jsonBody = data; return res; },
    } as any;
    return {
      req,
      res: res as Response,
      getStatus: () => statusCode,
      getBody: () => jsonBody,
    };
  }

  it("handles BusinessError", () => {
    const { req, res, getStatus, getBody } = setup();
    errorHandler(new BusinessError("A4001", "库存不足", 400), req, res, () => {});
    expect(getStatus()).toBe(400);
    expect(getBody().error.code).toBe("A4001");
  });

  it("handles BusinessError with details", () => {
    const { req, res, getBody } = setup();
    errorHandler(new BusinessError("A4001", "库存不足", 400, { sku: "x" }), req, res, () => {});
    expect(getBody().error.details).toEqual({ sku: "x" });
  });

  it("handles ZodError", () => {
    const { req, res, getStatus, getBody } = setup();
    const { z } = require("zod");
    const result = z.object({ name: z.string() }).safeParse({ name: 123 });
    errorHandler(result.error, req, res, () => {});
    expect(getStatus()).toBe(400);
    expect(getBody().error.code).toBe("A4000");
  });

  it("handles Prisma P2002 (unique constraint)", () => {
    const { req, res, getStatus, getBody } = setup();
    const err = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.15.0",
    });
    errorHandler(err, req, res, () => {});
    expect(getStatus()).toBe(409);
    expect(getBody().error.code).toBe("A4014");
  });

  it("handles Prisma P2025 (record not found)", () => {
    const { req, res, getStatus, getBody } = setup();
    const err = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "5.15.0",
    });
    errorHandler(err, req, res, () => {});
    expect(getStatus()).toBe(404);
    expect(getBody().error.code).toBe("A4040");
  });

  it("handles Prisma unknown error code", () => {
    const { req, res, getStatus, getBody } = setup();
    const err = new Prisma.PrismaClientKnownRequestError("Unknown", {
      code: "P9999",
      clientVersion: "5.15.0",
    });
    errorHandler(err, req, res, () => {});
    expect(getStatus()).toBe(500);
    expect(getBody().error.code).toBe("A5000");
  });

  it("handles generic Error (unknown)", () => {
    const { req, res, getStatus, getBody } = setup();
    errorHandler(new Error("boom"), req, res, () => {});
    expect(getStatus()).toBe(500);
    expect(getBody().error.code).toBe("A5000");
    // In dev mode, message is exposed
    expect(getBody().error.message).toBe("boom");
  });
});
