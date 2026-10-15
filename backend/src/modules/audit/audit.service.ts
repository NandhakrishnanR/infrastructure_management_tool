import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

export interface QueryAuditLogsInput {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
}

export class AuditService {
  public static async listAuditLogs(query: QueryAuditLogsInput) {
    const page = query.page ? Math.max(1, query.page) : 1;
    const limit = query.limit ? Math.min(100, Math.max(1, query.limit)) : 15;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.action) {
      where.action = query.action;
    }

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.actorId) {
      where.actorId = query.actorId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { entityType: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { entityId: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { actor: { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
        { actor: { email: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
    ]);

    return {
      logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
