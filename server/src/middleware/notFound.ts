import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/response';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'A4040',
      message: `路径不存在: ${req.method} ${req.originalUrl}`,
    },
  });
}

export { ApiResponse };
