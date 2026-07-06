import { UserRepository } from "../repositories/user.repository";
import { BaseService } from "./base.service";

export class UserService extends BaseService {
  private repo = new UserRepository();

  async getProfile(userId: string) {
    const user = await this.repo.findByIdSafe(userId);
    if (!user) this.notFound("用户不存在");
    return user;
  }

  async remove(userId: string) {
    const { prisma } = await import("../utils/prisma");
    const user = await this.repo.findById(userId);
    if (!user) this.notFound("用户不存在");
    return prisma.user.delete({ where: { id: userId } });
  }

  async list(page: number, pageSize: number) {
    const { prisma } = await import("../utils/prisma");
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);
    return { data: users, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }
}

export const userService = new UserService();
