import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { BusinessError } from '../utils/response';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { getRequestContext } from './requestId';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    requestId: getRequestContext()?.requestId,
    error: {
      code: 'A4040',
      message: `路径不存在: ${req.method} ${req.originalUrl}`,
    },
  });
}

function getRequestIdForError(): string | undefined {
  return getRequestContext()?.requestId;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // 业务错误
  if (err instanceof BusinessError) {
    logger.warn(`[${err.code}] ${err.message} (${req.method} ${req.originalUrl})`);
    res.status(err.statusCode).json({
      success: false,
      requestId: getRequestIdForError(),
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Zod 校验错误
  if (err instanceof ZodError) {
    logger.warn(`Zod validation failed: ${err.message}`);
    res.status(400).json({
      success: false,
      requestId: getRequestIdForError(),
      error: {
        code: 'A4000',
        message: '请求参数校验失败',
        details: err.flatten(),
      },
    });
    return;
  }

  // Prisma 已知错误
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let code = 'A5000';
    let message = '数据库操作失败';
    let status = 500;

    if (err.code === 'P2002') {
      code = 'A4014';
      message = '数据已存在（唯一约束冲突）';
      status = 409;
    } else if (err.code === 'P2025') {
      code = 'A4040';
      message = '记录不存在';
      status = 404;
    }

    logger.warn(`Prisma ${err.code}: ${err.message}`);
    res
      .status(status)
      .json({ success: false, error: { code, message, details: { prismaCode: err.code } } });
    return;
  }

  // 未知错误
  logger.error(`Unhandled error (${req.method} ${req.originalUrl}):`, err);
  res.status(500).json({
    success: false,
    requestId: getRequestIdForError(),
    error: {
      code: 'A5000',
      message: env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    },
  });
}
