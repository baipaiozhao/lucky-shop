import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../utils/prisma";
import { BusinessError } from "../utils/response";

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export async function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new BusinessError("A1001", "Authentication required", 401));
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string; email: string; role: string;
    };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.status !== "active") {
      return next(new BusinessError("A1003", "User not found or disabled", 401));
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    return next(new BusinessError("A1002", "Invalid or expired token", 401));
  }
}

export function adminMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return next(new BusinessError("A1008", "Admin access required", 403));
  }
  next();
}
