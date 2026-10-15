import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { LoginInput } from './auth.validation.js';
import { AuthUserPayload } from '../../types/index.js';

export class AuthService {
  public static async login(input: LoginInput, clientIp?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { quota: true },
    });

    // Generic failure message to prevent user enumeration
    if (!user) {
      // Record failed audit attempt
      await prisma.auditLog.create({
        data: {
          action: 'USER_LOGIN_FAILED',
          entityType: 'User',
          metadata: { email: input.email, ip: clientIp, reason: 'Invalid credentials' },
          result: 'FAILURE',
        },
      });
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'USER_LOGIN_FAILED',
          entityType: 'User',
          entityId: user.id,
          metadata: { ip: clientIp, userAgent, reason: 'Invalid credentials' },
          result: 'FAILURE',
        },
      });
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const payload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    // Record successful login audit
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        metadata: { ip: clientIp, userAgent },
        result: 'SUCCESS',
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        quota: user.quota,
      },
      token,
    };
  }

  public static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        quota: true,
      },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return user;
  }
}
