import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env, BCRYPT_ROUNDS } from "../config/env";
import { userRepository } from "../repositories/user.repository";
import { BaseService } from "./base.service";

const jwtExpiresIn = env.JWT_EXPIRES_IN as SignOptions["expiresIn"];

export class AuthService extends BaseService {
  /**
   * Register a new user. Returns token + public user profile.
   */
  async register(username: string, email: string, password: string) {
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) this.conflict("邮箱已被注册", "A1004");

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) this.conflict("用户名已被占用", "A1005");

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await userRepository.create({
      username,
      email,
      password: passwordHash,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: jwtExpiresIn },
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Login. Returns token + public user profile.
   */
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) this.unauthorized("邮箱或密码错误");

    if (user.status !== "active") {
      this.forbidden("账号已被禁用");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) this.unauthorized("邮箱或密码错误");

    await userRepository.update(user.id, { lastLoginAt: new Date() });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: jwtExpiresIn },
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  /**
   * Get current authenticated user profile.
   */
  async getProfile(userId: string) {
    const user = await userRepository.findByIdSafe(userId);
    if (!user) this.notFound("用户不存在");
    return user;
  }

  /**
   * Change password: validates old password, applies new one.
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) this.notFound("用户不存在");

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) this.unauthorized("原密码错误");

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await userRepository.update(userId, { password: newHash });

    return { message: "密码修改成功" };
  }

  /**
   * Forgot password — generates a reset token.
   * In production: send via email. Here: returns token directly (dev only).
   */
  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: "如果该邮箱已注册，重置链接已发送" };
    }

    const resetToken = jwt.sign(
      { id: user.id, type: "reset" },
      env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    return { resetToken, message: "请使用此令牌重置密码" };
  }

  /**
   * Reset password with a valid reset token.
   */
  async resetPassword(resetToken: string, newPassword: string) {
    try {
      const decoded = jwt.verify(resetToken, env.JWT_SECRET) as {
        id: string;
        type: string;
      };

      if (decoded.type !== "reset") {
        this.badRequest("无效的重置令牌", "A1003");
      }

      const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await userRepository.update(decoded.id, { password: newHash });

      return { message: "密码重置成功" };
    } catch (e: unknown) {
      if (e instanceof jwt.TokenExpiredError) {
        this.badRequest("重置令牌已过期", "A1002");
      }
      throw e;
    }
  }
}

export const authService = new AuthService();
