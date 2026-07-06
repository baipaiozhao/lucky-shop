import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '../utils/response';

const router = Router();
const prisma = new PrismaClient();

// 获取用户通知列表
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return ApiResponse.ok(res, { notifications });
  } catch (e) { next(e); }
});

// 标记单个通知为已读
router.post('/:id/mark-read', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      return ApiResponse.error(res, 404, 'N4001', '通知不存在');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return ApiResponse.ok(res, updated);
  } catch (e) { next(e); }
});

// 标记所有通知为已读
router.post('/mark-all-read', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return ApiResponse.ok(res, { message: '已全部标记为已读' });
  } catch (e) { next(e); }
});

// 获取未读通知数量
router.get('/unread-count', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const count = await prisma.notification.count({
      where: { userId, read: false },
    });

    return ApiResponse.ok(res, { count });
  } catch (e) { next(e); }
});

// 创建通知（内部调用）
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: object
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data ? JSON.stringify(data) : null,
      },
    });
  } catch (error) {
    console.error('创建通知失败:', error);
  }
}

export default router;
