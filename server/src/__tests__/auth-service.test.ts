import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import { AuthService } from "../services/auth.service";
import { userRepository } from "../repositories/user.repository";
import { prisma } from "../utils/prisma";

describe("AuthService", () => {
  const authService = new AuthService();

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["svc_test@example.com"] } },
    });
    await prisma.$disconnect();
  });

  describe("register", () => {
    it("creates a user and returns token + profile", async () => {
      const result = await authService.register("svcuser1", "svc_test@example.com", "SvcPass1");
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe("svc_test@example.com");
      expect(result.user.username).toBe("svcuser1");
      expect(result.user.role).toBe("user");
      // Password must not be in response
      expect((result.user as Record<string, unknown>).password).toBeUndefined();
    });

    it("throws conflict on duplicate email", async () => {
      await expect(
        authService.register("svcuser2", "svc_test@example.com", "SvcPass2")
      ).rejects.toThrow();
    });
  });

  describe("login", () => {
    beforeAll(async () => {
      try { await authService.register("svclogin", "svc_login@example.com", "LoginPass1"); } catch {}
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { email: "svc_login@example.com" } });
    });

    it("returns token for valid credentials", async () => {
      const result = await authService.login("svc_login@example.com", "LoginPass1");
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe("svc_login@example.com");
    });

    it("throws unauthorized for wrong password", async () => {
      await expect(
        authService.login("svc_login@example.com", "WrongPass1")
      ).rejects.toThrow();
    });

    it("throws unauthorized for nonexistent email", async () => {
      await expect(
        authService.login("nobody@example.com", "Pass1234")
      ).rejects.toThrow();
    });
  });

  describe("getProfile", () => {
    let userId: string;

    beforeAll(async () => {
      const r = await authService.register("svcprof", "svc_profile@example.com", "ProfPass1");
      userId = r.user.id;
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { email: "svc_profile@example.com" } });
    });

    it("returns user profile without password", async () => {
      const user = await authService.getProfile(userId);
      expect((user as Record<string, unknown>).password).toBeUndefined();
      expect(user).toBeDefined();
    });

    it("throws notFound for invalid id", async () => {
      await expect(authService.getProfile("nonexistent-id")).rejects.toThrow();
    });
  });

  describe("changePassword", () => {
    let userId: string;

    beforeAll(async () => {
      const r = await authService.register("svcpw", "svc_changepw@example.com", "OldPass1");
      userId = r.user.id;
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { email: "svc_changepw@example.com" } });
    });

    it("changes password and returns success message", async () => {
      const result = await authService.changePassword(userId, "OldPass1", "NewPass1");
      expect(result.message).toBeDefined();
    });

    it("throws unauthorized for wrong old password", async () => {
      await expect(
        authService.changePassword(userId, "WrongOld", "NewPass2")
      ).rejects.toThrow();
    });
  });

  describe("forgotPassword / resetPassword", () => {
    beforeAll(async () => {
      try { await authService.register("svcreset", "svc_reset@example.com", "ResetPass1"); } catch {}
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { email: "svc_reset@example.com" } });
    });

    it("returns resetToken for existing email", async () => {
      const result = await authService.forgotPassword("svc_reset@example.com");
      expect(result.resetToken).toBeDefined();
    });

    it("returns generic message for nonexistent email", async () => {
      const result = await authService.forgotPassword("no@example.com");
      expect(result.resetToken).toBeUndefined();
    });

    it("resets password with valid token", async () => {
      const { resetToken } = await authService.forgotPassword("svc_reset@example.com");
      const result = await authService.resetPassword(resetToken!, "NewResetPass1");
      expect(result.message).toBeDefined();
    });

    it("throws on invalid reset token", async () => {
      await expect(
        authService.resetPassword("invalid-token", "Pass1234")
      ).rejects.toThrow();
    });
  });
});
