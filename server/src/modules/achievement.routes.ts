import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '../utils/response';

const router = Router();
const prisma = new PrismaClient();

// 获取所有成就列表
router.get('/', async (_req, res, next) => {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    return ApiResponse.ok(res, { achievements });
  } catch (e) { next(e); }
});

// 获取用户的成就进度
router.get('/my', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // 获取所有成就
    const allAchievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    // 获取用户成就记录
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
    });

    // 构建用户成就映射
    const userAchievementMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua])
    );

    // 合并成就数据
    const result = allAchievements.map((achievement) => {
      const userAchievement = userAchievementMap.get(achievement.id);
      if (userAchievement) {
        return {
          ...userAchievement,
          achievement,
        };
      }
      return {
        achievementId: achievement.id,
        progress: 0,
        target: 1,
        completed: false,
        achievement,
      };
    });

    return ApiResponse.ok(res, { achievements: result });
  } catch (e) { next(e); }
});

// 检查并更新成就进度（内部调用）
export async function checkAndUpdateAchievements(
  userId: string,
  category: string,
  currentValue: number
) {
  try {
    const achievements = await prisma.achievement.findMany({
      where: {
        isActive: true,
        category,
      },
    });

    for (const achievement of achievements) {
      const condition = JSON.parse(achievement.condition || '{}');
      const target = condition.target || 1;

      let userAchievement = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: { userId, achievementId: achievement.id },
        },
      });

      if (!userAchievement) {
        userAchievement = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: currentValue,
            target,
            completed: currentValue >= target,
            completedAt: currentValue >= target ? new Date() : null,
          },
        });
      } else if (!userAchievement.completed) {
        const newProgress = Math.max(userAchievement.progress, currentValue);
        const completed = newProgress >= target;

        userAchievement = await prisma.userAchievement.update({
          where: { id: userAchievement.id },
          data: {
            progress: newProgress,
            completed,
            completedAt: completed ? new Date() : null,
          },
        });

        // 如果完成了成就，发送通知
        if (completed && !userAchievement.completed) {
          await prisma.notification.create({
            data: {
              userId,
              type: 'achievement',
              title: `🎉 成就解锁：${achievement.name}`,
              body: achievement.description,
            },
          });

          // 发放奖励（这里可以根据reward字段处理）
          // 例如：reward = "points:100" 表示奖励100积分
          if (achievement.reward?.startsWith('points:')) {
            const points = parseInt(achievement.reward.split(':')[1], 10);
            await prisma.user.update({
              where: { id: userId },
              data: { points: { increment: points } },
            });

            await prisma.pointsTransaction.create({
              data: {
                userId,
                amount: points,
                type: 'earn',
                source: 'achievement',
                remark: `成就奖励：${achievement.name}`,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('更新成就进度失败:', error);
  }
}

export default router;
