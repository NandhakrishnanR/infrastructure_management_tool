import { prisma } from '../../config/database.js';
import { AuthUserPayload } from '../../types/index.js';
import { Role, PowerState, Prisma } from '@prisma/client';

export interface QueryInventoryInput {
  page?: number;
  limit?: number;
  search?: string;
  powerState?: PowerState;
  region?: string;
  environment?: string;
  ownerId?: string;
}

export class InventoryService {
  public static async listInventory(user: AuthUserPayload, query: QueryInventoryInput) {
    const page = query.page ? Math.max(1, query.page) : 1;
    const limit = query.limit ? Math.min(100, Math.max(1, query.limit)) : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.VirtualMachineWhereInput = {};

    // Developers can strictly only view their own inventory
    if (user.role === Role.DEVELOPER) {
      where.ownerId = user.id;
    } else if (query.ownerId) {
      where.ownerId = query.ownerId;
    }

    if (query.powerState) {
      where.powerState = query.powerState;
    }

    if (query.region) {
      where.region = query.region;
    }

    if (query.environment) {
      where.environment = query.environment;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { hostname: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { operatingSystem: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [total, vms] = await Promise.all([
      prisma.virtualMachine.count({ where }),
      prisma.virtualMachine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          request: {
            select: { id: true, justification: true, environment: true },
          },
        },
      }),
    ]);

    return {
      vms,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getVmById(user: AuthUserPayload, id: string) {
    const vm = await prisma.virtualMachine.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, role: true },
        },
        request: {
          include: {
            provisioningJobs: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!vm) {
      throw { statusCode: 404, message: 'Virtual Machine not found in inventory' };
    }

    if (user.role === Role.DEVELOPER && vm.ownerId !== user.id) {
      throw {
        statusCode: 403,
        message: 'Forbidden: You do not have permission to view this VM',
      };
    }

    return vm;
  }

  public static async togglePower(
    user: AuthUserPayload,
    id: string,
    action: 'START' | 'STOP' | 'RESTART'
  ) {
    const vm = await prisma.virtualMachine.findUnique({
      where: { id },
    });

    if (!vm) {
      throw { statusCode: 404, message: 'Virtual Machine not found' };
    }

    if (user.role === Role.DEVELOPER && vm.ownerId !== user.id) {
      throw {
        statusCode: 403,
        message: 'Forbidden: You do not have permission to control power for this VM',
      };
    }

    let targetPowerState: PowerState;
    if (action === 'START') {
      targetPowerState = PowerState.RUNNING;
    } else if (action === 'STOP') {
      targetPowerState = PowerState.STOPPED;
    } else {
      targetPowerState = PowerState.RUNNING;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const vmUpdated = await tx.virtualMachine.update({
        where: { id },
        data: { powerState: targetPowerState },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: `VM_POWER_${action}`,
          entityType: 'VirtualMachine',
          entityId: id,
          metadata: {
            previousState: vm.powerState,
            newState: targetPowerState,
            action,
            isSimulated: true,
          },
          result: 'SUCCESS',
        },
      });

      return vmUpdated;
    });

    return updated;
  }
}
