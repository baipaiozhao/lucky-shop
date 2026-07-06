import { BusinessError } from "../utils/response";

/**
 * Base Service — Provides throw helpers for common business errors.
 * All services extend this to get typed error throwing.
 */
export abstract class BaseService {
  protected notFound(message = "记录不存在"): never {
    throw new BusinessError("A2001", message, 404);
  }

  protected badRequest(message: string, code = "A4000"): never {
    throw new BusinessError(code, message, 400);
  }

  protected forbidden(message = "权限不足"): never {
    throw new BusinessError("A1008", message, 403);
  }

  protected conflict(message: string, code = "A2002"): never {
    throw new BusinessError(code, message, 409);
  }

  protected unauthorized(message: string, code = "A1006"): never {
    throw new BusinessError(code, message, 401);
  }
}
