import cron from 'node-cron';
import { logger } from './utils/logger';

/**
 * 启动所有定时任务
 * 阶段 S1: 占位任务已注册，业务逻辑在 S4+ 阶段填充
 *
 * 注意：调度任务中 prisma 操作使用动态 import，避免 prisma generate 之前启动失败
 */
export function startScheduler(): void {
  // 1. 释放锁定的过期券 (每小时) - S4 阶段完整实现
  cron.schedule('0 * * * *', async () => {
    try {
      const { prisma } = await import('./utils/prisma');
      const result = await prisma.userCoupon.updateMany({
        where: {
          status: 'locked',
          lockedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) },
        },
        data: { status: 'unused', lockedAt: null, lockedOrderId: null },
      });
      if (result.count > 0) {
        logger.info(`[Scheduler] Released ${result.count} locked coupons`);
      }
    } catch (e) {
      logger.error('[Scheduler] release-locked-coupons failed:', e);
    }
  });

  // 2. 标记过期券 (每天 0 点)
  cron.schedule('0 0 * * *', async () => {
    try {
      const { prisma } = await import('./utils/prisma');
      const result = await prisma.userCoupon.updateMany({
        where: { status: 'unused', expiredAt: { lt: new Date() } },
        data: { status: 'expired' },
      });
      if (result.count > 0) {
        logger.info(`[Scheduler] Expired ${result.count} coupons`);
      }
    } catch (e) {
      logger.error('[Scheduler] expire-coupons failed:', e);
    }
  });

  // 3. 清理过期游戏会话 (每 5 分钟) - S5 阶段
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { prisma } = await import('./utils/prisma');
      const result = await prisma.gameSession.updateMany({
        where: { status: 'started', expiresAt: { lt: new Date() } },
        data: { status: 'expired' },
      });
      if (result.count > 0) {
        logger.info(`[Scheduler] Expired ${result.count} game sessions`);
      }
    } catch (e) {
      logger.error('[Scheduler] expire-sessions failed:', e);
    }
  });

  // 4. 心跳日志 (每分钟)
  cron.schedule('* * * * *', () => {
    logger.debug('[Scheduler] heartbeat');
  });

  logger.info('📅 Scheduler started: 4 cron jobs registered');
}
