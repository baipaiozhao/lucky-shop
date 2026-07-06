import type { Response } from "express";
import { ErrorCodes as _ErrorCodes } from "../shared";

export class ApiResponse {
  /** 200 success */
  static ok<T>(
    res: Response,
    data: T,
    messageOrMeta?: string | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ) {
    if (typeof messageOrMeta === "string") {
      const body: Record<string, unknown> = { success: true, data, message: messageOrMeta };
      if (meta) body.meta = meta;
      return res.json(body);
    }
    const body: Record<string, unknown> = { success: true, data };
    if (meta) {
      body.meta = meta;
    } else if (messageOrMeta && typeof messageOrMeta === "object") {
      body.meta = messageOrMeta as Record<string, unknown>;
    }
    return res.json(body);
  }

  /** 201 created */
  static created<T>(res: Response, data: T) {
    return res.status(201).json({ success: true, data });
  }

  static error(res: Response, status: number, code: string, message: string, details?: unknown) {
    const body: Record<string, unknown> = { success: false, error: { code, message } };
    if (details !== undefined) (body.error as Record<string, unknown>).details = details;
    return res.status(status).json(body);
  }
}

export class BusinessError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(code: string, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "BusinessError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export { _ErrorCodes as ErrorCodes };
