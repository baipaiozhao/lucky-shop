import { Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository";

/**
 * User Repository — All user-related data access.
 */
export class UserRepository extends BaseRepository {
  findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  findByUsername(username: string) {
    return this.db.user.findUnique({ where: { username } });
  }

  findByIdSafe(id: string) {
    return this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        points: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  }

  create(data: any) {
    return this.db.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.db.user.update({ where: { id }, data });
  }

  incrementPoints(id: string, amount: number) {
    return this.db.user.update({
      where: { id },
      data: { points: { increment: amount } },
    });
  }

  decrementPoints(id: string, amount: number) {
    return this.db.user.update({
      where: { id },
      data: { points: { decrement: amount } },
    });
  }
}

export const userRepository = new UserRepository();

