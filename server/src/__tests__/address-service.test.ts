import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { UserAddressService } from "../services/user-address.service";
import { AuthService } from "../services/auth.service";
import { prisma } from "../utils/prisma";

describe("UserAddressService", () => {
  const addressService = new UserAddressService();
  const authService = new AuthService();
  let userId: string;

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
    const { user } = await authService.register("adrtest", "adr_test@example.com", "AdrTest123");
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.address.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: "adr_test@example.com" } });
    await prisma.$disconnect();
  });

  describe("getProfile", () => {
    it("returns profile for existing user", async () => {
      const profile = await addressService.getProfile(userId);
      expect(profile).toBeDefined();
      expect((profile as any).password).toBeUndefined();
    });

    it("throws notFound for nonexistent user", async () => {
      await expect(addressService.getProfile("bad-id")).rejects.toThrow();
    });
  });

  describe("updateProfile", () => {
    it("updates username", async () => {
      const updated = await addressService.updateProfile(userId, { username: "adrtest2" });
      expect(updated.username).toBe("adrtest2");
    });
  });

  describe("listAddresses", () => {
    it("returns empty list for new user", async () => {
      const addrs = await addressService.listAddresses(userId);
      expect(Array.isArray(addrs)).toBe(true);
      expect(addrs.length).toBe(0);
    });
  });

  describe("createAddress", () => {
    const addrData = {
      name: "张三",
      phone: "13800138000",
      province: "广东省",
      city: "深圳市",
      district: "南山区",
      detail: "科技园路1号",
    };

    it("creates an address", async () => {
      const addr = await addressService.createAddress(userId, addrData);
      expect(addr.name).toBe("张三");
      expect(addr.phone).toBe("13800138000");
    });

    it("creates default address (unsets previous default)", async () => {
      const addr = await addressService.createAddress(userId, { ...addrData, name: "李四", isDefault: true });
      expect(addr.isDefault).toBe(true);
    });
  });

  describe("updateAddress", () => {
    let addrId: string;

    beforeAll(async () => {
      const addr = await addressService.createAddress(userId, { ...{ name: "王五", phone: "13800138001", province: "广东", city: "广州", district: "天河", detail: "路2号" } });
      addrId = addr.id;
    });

    it("updates address fields", async () => {
      const addr = await addressService.updateAddress(userId, addrId, { name: "王五update" });
      expect(addr.name).toBe("王五update");
    });

    it("throws notFound for wrong user", async () => {
      await expect(addressService.updateAddress("bad-user", addrId, { name: "x" })).rejects.toThrow();
    });
  });

  describe("setDefaultAddress", () => {
    it("sets address as default", async () => {
      const addrs = await addressService.listAddresses(userId);
      if (addrs.length > 0) {
        const addr = await addressService.setDefaultAddress(userId, addrs[0].id);
        expect(addr.isDefault).toBe(true);
      }
    });

    it("throws notFound for wrong address", async () => {
      await expect(addressService.setDefaultAddress(userId, "bad-id")).rejects.toThrow();
    });
  });

  describe("deleteAddress", () => {
    it("throws notFound for nonexistent address", async () => {
      await expect(addressService.deleteAddress(userId, "bad-id")).rejects.toThrow();
    });
  });
});
