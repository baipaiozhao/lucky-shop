import { describe, it, expect } from "@jest/globals";
import { BaseService } from "../services/base.service";
import { BusinessError } from "../utils/response";

// Concrete subclass for testing
class TestService extends BaseService {
  throwNotFound(msg?: string): never { this.notFound(msg); }
  throwBadRequest(msg: string, code?: string): never { this.badRequest(msg, code); }
  throwForbidden(msg?: string): never { this.forbidden(msg); }
  throwConflict(msg: string, code?: string): never { this.conflict(msg, code); }
  throwUnauthorized(msg: string, code?: string): never { this.unauthorized(msg, code); }
}

describe("BaseService error helpers", () => {
  const svc = new TestService();

  it("notFound throws BusinessError with 404", () => {
    try { svc.throwNotFound(); } catch (e) {
      expect(e).toBeInstanceOf(BusinessError);
      expect((e as BusinessError).code).toBe("A2001");
      expect((e as BusinessError).statusCode).toBe(404);
      expect((e as BusinessError).message).toBe("记录不存在");
    }
  });

  it("notFound with custom message", () => {
    try { svc.throwNotFound("用户不存在"); } catch (e) {
      expect((e as BusinessError).message).toBe("用户不存在");
    }
  });

  it("badRequest throws BusinessError with 400", () => {
    try { svc.throwBadRequest("参数错误"); } catch (e) {
      expect((e as BusinessError).statusCode).toBe(400);
      expect((e as BusinessError).code).toBe("A4000");
    }
  });

  it("badRequest with custom code", () => {
    try { svc.throwBadRequest("库存不足", "A4001"); } catch (e) {
      expect((e as BusinessError).code).toBe("A4001");
    }
  });

  it("forbidden throws BusinessError with 403", () => {
    try { svc.throwForbidden(); } catch (e) {
      expect((e as BusinessError).statusCode).toBe(403);
      expect((e as BusinessError).code).toBe("A1008");
    }
  });

  it("conflict throws BusinessError with 409", () => {
    try { svc.throwConflict("邮箱已注册"); } catch (e) {
      expect((e as BusinessError).statusCode).toBe(409);
      expect((e as BusinessError).code).toBe("A2002");
    }
  });

  it("conflict with custom code", () => {
    try { svc.throwConflict("重复操作", "A4011"); } catch (e) {
      expect((e as BusinessError).code).toBe("A4011");
    }
  });

  it("unauthorized throws BusinessError with 401", () => {
    try { svc.throwUnauthorized("密码错误"); } catch (e) {
      expect((e as BusinessError).statusCode).toBe(401);
      expect((e as BusinessError).code).toBe("A1006");
    }
  });

  it("unauthorized with custom code", () => {
    try { svc.throwUnauthorized("令牌过期", "A1002"); } catch (e) {
      expect((e as BusinessError).code).toBe("A1002");
    }
  });
});
