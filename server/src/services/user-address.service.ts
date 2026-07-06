import { prisma } from "../utils/prisma";
import { BaseService } from "./base.service";
import { addressSchema } from "../shared";

export class UserAddressService extends BaseService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true, avatar: true, phone: true },
    });
    if (!user) this.notFound("用户不存在");
    return user;
  }

  async updateProfile(userId: string, data: { username?: string; phone?: string; avatar?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, email: true, role: true, avatar: true, phone: true },
    });
    return user;
  }

  async listAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async createAddress(userId: string, data: { name: string; phone: string; province: string; city: string; district: string; detail: string; isDefault?: boolean }) {
    const { isDefault, ...rest } = data;
    if (isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    return prisma.address.create({
      data: { ...rest, userId, isDefault: isDefault || false },
    });
  }

  async updateAddress(userId: string, addressId: string, data: Partial<{ name: string; phone: string; province: string; city: string; district: string; detail: string; isDefault: boolean }>) {
    const existing = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!existing) this.notFound("地址不存在");
    const { ...rest } = data;
    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true, id: { not: existing.id } }, data: { isDefault: false } });
    }
    return prisma.address.update({ where: { id: existing.id }, data: rest });
  }

  async deleteAddress(userId: string, addressId: string) {
    const existing = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!existing) this.notFound("地址不存在");
    await prisma.address.delete({ where: { id: existing.id } });
    return { message: "已删除" };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const existing = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!existing) this.notFound("地址不存在");
    await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    return prisma.address.update({ where: { id: existing.id }, data: { isDefault: true } });
  }
}

export const userAddressService = new UserAddressService();

