import { prisma } from "../utils/prisma";
import { BaseService } from "./base.service";
import { gameRewardService } from "./game-reward.service";

export class GameService extends BaseService {
  async getLobby(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId, status: { in: ["paid", "completed", "shipped"] } },
    });
    const totalChances = orders.reduce((s, o) => s + o.gameChances, 0);
    const usedChances = orders.reduce((s, o) => s + o.gameChancesUsed, 0);
    const remainingChances = Math.max(0, totalChances - usedChances);

    const gameRecords = await prisma.gameRecord.findMany({ where: { userId } });
    const gameTypes = ["wheel", "scratch", "memory", "game2048", "reaction"];
    const gameNames: Record<string, string> = {
      wheel: "Lucky Wheel", scratch: "Scratch Card", memory: "Memory Match",
      game2048: "2048", reaction: "Reaction",
    };
    const gameIcons: Record<string, string> = {
      wheel: "🎰", scratch: "🎟️", memory: "🧠", game2048: "🎮", reaction: "⚡",
    };

    const games = gameTypes.map((type) => {
      const records = gameRecords.filter((r) => r.gameType === type);
      return { type, name: gameNames[type], icon: gameIcons[type], totalPlayed: records.length, totalWon: records.filter((r) => r.passed).length };
    });

    const allPassed = gameRecords.filter((r) => r.passed);
    return {
      remainingChances, totalChances, totalPlayed: gameRecords.length,
      totalWon: allPassed.length, streak: this.calculateStreak(allPassed),
      lastPlayedGame: gameRecords[0]?.gameType || null, games,
    };
  }

  async startGame(userId: string, type: string, difficulty: string, orderId?: string) {
    const crypto = await import("crypto");
    const orders = await prisma.order.findMany({
      where: { userId, status: { in: ["paid", "completed", "shipped"] } },
    });
    const usedChances = orders.reduce((s, o) => s + o.gameChancesUsed, 0);
    const totalChances = orders.reduce((s, o) => s + o.gameChances, 0);
    if (usedChances >= totalChances) this.badRequest("No game chances left", "A4003");

    let targetOrder: { id: string; gameChances: number; gameChancesUsed: number } | null = null;
    if (orderId) {
      const o = orders.find((ord) => ord.id === orderId);
      if (o && o.gameChances > o.gameChancesUsed) targetOrder = o;
    }
    if (!targetOrder) {
      for (const o of orders) { if (o.gameChances > o.gameChancesUsed) { targetOrder = o; break; } }
    }
    if (!targetOrder) this.badRequest("Complete an order first", "A4003");

    const rngSeed = crypto.randomBytes(16).toString("hex");
    const serverNonce = crypto.randomBytes(8).toString("hex");
    const config = this.getGameConfig(type, difficulty);

    const session = await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: targetOrder!.id }, data: { gameChancesUsed: { increment: 1 } } });
      return tx.gameSession.create({
        data: { userId, orderId: targetOrder!.id, gameType: type, difficulty, rngSeed, serverNonce, configSnapshot: JSON.stringify(config), startedAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      });
    });
    return { sessionId: session.id, rngSeed, serverNonce, config, expiresAt: session.expiresAt };
  }

  async finishGame(userId: string, params: { sessionId: string; score: number; duration: number; clientNonce?: string }) {
    const { sessionId, score, duration } = params;
    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) this.badRequest("Invalid session", "A4003");
    if (session.status !== "started") this.badRequest("Session ended", "A4007");
    if (new Date() > new Date(session.expiresAt)) this.badRequest("Session expired", "A4007");

    const config = JSON.parse(session.configSnapshot as string);
    const passed = this.checkPassCondition(session.gameType, session.difficulty, score, duration, config);

    const result = await prisma.$transaction(async (tx) => {
      await tx.gameSession.update({ where: { id: sessionId }, data: { status: "completed", completedAt: new Date() } });
      const { record, prize } = await gameRewardService.applyReward(tx, userId, sessionId, session.orderId, session.gameType, session.difficulty, passed, score, duration);
      return { record, prize };
    });

    return {
      passed,
      prize: result.prize ? { id: result.prize.id, name: result.prize.name, type: result.prize.type, value: Number(result.prize.value) } : null,
      record: { id: result.record.id, score, duration, createdAt: result.record.createdAt },
      consolation: passed ? null : { type: "points", value: 10, message: "Participation reward" },
    };
  }

  async getHistory(userId: string) {
    return prisma.gameRecord.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 });
  }

  private getGameConfig(type: string, difficulty: string): Record<string, unknown> {
    const configs: Record<string, Record<string, Record<string, unknown>>> = {
      wheel: { easy: { segmentCount: 4, spinDuration: 6000 }, medium: { segmentCount: 6, spinDuration: 8000 }, hard: { segmentCount: 8, spinDuration: 10000 } },
      scratch: { easy: { coverage: 0.3, passThreshold: 0.6 }, medium: { coverage: 0.5, passThreshold: 0.8 }, hard: { coverage: 0.7, passThreshold: 0.9 } },
      memory: { easy: { pairs: 3, cols: 3, rows: 2, timeLimit: 30 }, medium: { pairs: 4, cols: 4, rows: 2, timeLimit: 60 }, hard: { pairs: 6, cols: 4, rows: 3, timeLimit: 90 } },
      game2048: { easy: { target: 64 }, medium: { target: 256 }, hard: { target: 1024 } },
      reaction: { easy: { rounds: 10, targetAvg: 500, minValid: 6 }, medium: { rounds: 10, targetAvg: 350, minValid: 7 }, hard: { rounds: 10, targetAvg: 200, minValid: 8 } },
    };
    return configs[type]?.[difficulty] ?? configs[type]?.medium ?? {};
  }

  private checkPassCondition(type: string, _difficulty: string, score: number, duration: number, config: Record<string, unknown>): boolean {
    switch (type) {
      case "wheel": return true;
      case "scratch": return score >= (Number(config.passThreshold) || 1) * 100;
      case "memory": return score >= (Number(config.pairs) || Infinity) && duration <= (Number(config.timeLimit) || 0) * 1000;
      case "game2048": return score >= (Number(config.target) || Infinity);
      case "reaction": return duration <= (Number(config.targetAvg) || 0);
      default: return false;
    }
  }

  private calculateStreak(records: { createdAt: Date | string; passed: boolean }[]): number {
    if (!records.length) return 0;
    let streak = 0;
    const sorted = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    for (const r of sorted) { if (r.passed) streak++; else break; }
    return streak;
  }
}

export const gameService = new GameService();
