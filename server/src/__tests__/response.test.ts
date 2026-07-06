import { describe, it, expect } from "@jest/globals";
import { ApiResponse, BusinessError } from "../utils/response";

// Simple mock: capture what was sent
function capture() {
  let capturedStatus = 200;
  let capturedBody: unknown = null;
  const res = {
    status(code: number) { capturedStatus = code; return res; },
    json(data: unknown) { capturedBody = data; return res; },
  };
  return { res: res as any, getStatus: () => capturedStatus, getBody: () => capturedBody };
}

describe("ApiResponse", () => {
  describe("ok", () => {
    it("returns 200 with data only", () => {
      const { res, getBody } = capture();
      ApiResponse.ok(res, { id: 1 });
      expect(getBody()).toEqual({ success: true, data: { id: 1 } });
    });

    it("returns 200 with data and string message", () => {
      const { res, getBody } = capture();
      ApiResponse.ok(res, { id: 1 }, "ok");
      expect(getBody()).toEqual({ success: true, data: { id: 1 }, message: "ok" });
    });

    it("returns 200 with data and meta as third arg", () => {
      const { res, getBody } = capture();
      ApiResponse.ok(res, [{ name: "a" }], { page: 1, total: 10 });
      expect(getBody()).toEqual({ success: true, data: [{ name: "a" }], meta: { page: 1, total: 10 } });
    });

    it("returns 200 with data, undefined, meta as fourth arg", () => {
      const { res, getBody } = capture();
      ApiResponse.ok(res, [{ name: "a" }], undefined, { page: 1, total: 10 });
      expect(getBody()).toEqual({ success: true, data: [{ name: "a" }], meta: { page: 1, total: 10 } });
    });

    it("returns 200 with data + message + meta", () => {
      const { res, getBody } = capture();
      ApiResponse.ok(res, { id: 1 }, "done", { took: 5 });
      expect(getBody()).toEqual({ success: true, data: { id: 1 }, message: "done", meta: { took: 5 } });
    });
  });

  describe("created", () => {
    it("returns 201 with data", () => {
      const { res, getStatus, getBody } = capture();
      ApiResponse.created(res, { id: "new" });
      expect(getStatus()).toBe(201);
      expect(getBody()).toEqual({ success: true, data: { id: "new" } });
    });
  });

  describe("error", () => {
    it("returns status with code and message", () => {
      const { res, getStatus, getBody } = capture();
      ApiResponse.error(res, 400, "A3001", "bad");
      expect(getStatus()).toBe(400);
      expect(getBody()).toEqual({ success: false, error: { code: "A3001", message: "bad" } });
    });

    it("includes details when provided", () => {
      const { res, getBody } = capture();
      ApiResponse.error(res, 422, "A4000", "fail", { field: "email" });
      expect(getBody()).toEqual({
        success: false,
        error: { code: "A4000", message: "fail", details: { field: "email" } },
      });
    });

    it("omits details when undefined", () => {
      const { res, getBody } = capture();
      ApiResponse.error(res, 500, "A5000", "boom");
      const body = getBody() as any;
      expect(body.success).toBe(false);
      expect(body.error.details).toBeUndefined();
    });
  });
});

describe("BusinessError", () => {
  it("constructs with code, message, default status 400", () => {
    const e = new BusinessError("A4001", "low stock");
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(BusinessError);
    expect(e.name).toBe("BusinessError");
    expect(e.code).toBe("A4001");
    expect(e.message).toBe("low stock");
    expect(e.statusCode).toBe(400);
  });

  it("constructs with custom statusCode and details", () => {
    const e = new BusinessError("A2001", "not found", 404, { id: "x" });
    expect(e.statusCode).toBe(404);
    expect(e.details).toEqual({ id: "x" });
  });
});
