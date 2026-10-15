import { Worker, Job } from 'bullmq';
import { prisma } from '../config/database.js';
import { redisConnectionOptions } from '../config/redis.js';
import { PROVISIONING_QUEUE_NAME, ProvisioningJobData } from '../queues/provisioningQueue.js';
import { TerraformRunner } from '../services/terraformRunner.js';
import { StatusTransitionService } from '../services/statusTransitionService.js';
import { RequestStatus, JobStatus, PowerState } from '@prisma/client';
import { logger } from '../utils/logger.js';

const terraformRunner = new TerraformRunner();

export const provisioningWorker = new Worker<ProvisioningJobData>(
  PROVISIONING_QUEUE_NAME,
  async (job: Job<ProvisioningJobData>) => {
    const { requestId, triggeredById } = job.data;
    logger.info(`[Worker] Picked up job ${job.id} for request ${requestId}`);

    // 1. Fetch request with relations
    const request = await prisma.infrastructureRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: true,
        virtualMachine: true,
      },
    });

    if (!request) {
      throw new Error(`Infrastructure request ${requestId} not found`);
    }

    // 2. Validate eligibility
    const validStartingStates: RequestStatus[] = [
      RequestStatus.APPROVED,
      RequestStatus.PROVISIONING,
      RequestStatus.FAILED, // if retried
    ];

    if (!validStartingStates.includes(request.status)) {
      throw new Error(
        `Request ${requestId} is in status ${request.status}, which is not eligible for provisioning.`
      );
    }

    // 3. Create or update ProvisioningJob record in DB
    let dbJob = await prisma.provisioningJob.findFirst({
      where: { requestId },
      orderBy: { createdAt: 'desc' },
    });

    if (!dbJob || dbJob.status === JobStatus.COMPLETED) {
      dbJob = await prisma.provisioningJob.create({
        data: {
          requestId,
          status: JobStatus.IN_PROGRESS,
          stage: 'VALIDATING',
          startedAt: new Date(),
          attempts: job.attemptsMade + 1,
        },
      });
    } else {
      dbJob = await prisma.provisioningJob.update({
        where: { id: dbJob.id },
        data: {
          status: JobStatus.IN_PROGRESS,
          stage: 'VALIDATING',
          startedAt: new Date(),
          attempts: dbJob.attempts + 1,
        },
      });
    }

    // Update request status to PROVISIONING if not already
    if (request.status !== RequestStatus.PROVISIONING) {
      await prisma.$transaction(async (tx) => {
        await StatusTransitionService.executeTransition(
          tx,
          requestId,
          RequestStatus.PROVISIONING,
          triggeredById,
          'Provisioning worker commenced execution'
        );
      });
    }

    // Audit log: Job start
    await prisma.auditLog.create({
      data: {
        actorId: triggeredById || null,
        action: 'PROVISIONING_STARTED',
        entityType: 'ProvisioningJob',
        entityId: dbJob.id,
        metadata: {
          requestId,
          vmName: request.name,
          cpu: request.cpu,
          ramMb: request.ramMb,
        },
        result: 'SUCCESS',
      },
    });

    // 4. Execute Terraform provisioning with live stage updates
    const executionResult = await terraformRunner.executeProvisioning(
      {
        requestId: request.id,
        vmName: request.name,
        operatingSystem: request.operatingSystem,
        cpu: request.cpu,
        ramMb: request.ramMb,
        diskGb: request.diskGb,
        region: request.region,
        environment: request.environment,
        ownerEmail: request.requester.email,
      },
      async (stage, logLine) => {
        await prisma.provisioningJob.update({
          where: { id: dbJob!.id },
          data: {
            stage,
            logs: `${dbJob!.logs || ''}\n${logLine}`,
          },
        });
      }
    );

    // 5. Handle Execution Outcome
    if (executionResult.success) {
      logger.info(`[Worker] Provisioning succeeded for request ${requestId}`);

      await prisma.$transaction(async (tx) => {
        // Create or update VM in inventory
        await tx.virtualMachine.upsert({
          where: { requestId: request.id },
          create: {
            requestId: request.id,
            ownerId: request.requesterId,
            name: request.name,
            hostname: executionResult.hostname || `demo-${request.name}.internal.infrapilot.local`,
            operatingSystem: request.operatingSystem,
            provider: request.provider,
            cpu: request.cpu,
            ramMb: request.ramMb,
            diskGb: request.diskGb,
            region: request.region,
            environment: request.environment,
            powerState: PowerState.RUNNING,
            provisioningMode: 'DEMO_TERRAFORM',
          },
          update: {
            powerState: PowerState.RUNNING,
            hostname: executionResult.hostname,
          },
        });

        // Transition request to ACTIVE
        await StatusTransitionService.executeTransition(
          tx,
          requestId,
          RequestStatus.ACTIVE,
          null,
          'Terraform apply succeeded and inventory updated'
        );

        // Update Job record
        await tx.provisioningJob.update({
          where: { id: dbJob!.id },
          data: {
            status: JobStatus.COMPLETED,
            stage: 'COMPLETED',
            finishedAt: new Date(),
            logs: executionResult.logs,
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            actorId: triggeredById || null,
            action: 'PROVISIONING_COMPLETED',
            entityType: 'VirtualMachine',
            entityId: request.id,
            metadata: {
              hostname: executionResult.hostname,
              ipAddress: executionResult.ipAddress,
              manifestPath: executionResult.manifestPath,
            },
            result: 'SUCCESS',
          },
        });
      });

      return { success: true, hostname: executionResult.hostname };
    } else {
      logger.error(`[Worker] Provisioning failed for request ${requestId}: ${executionResult.errorMessage}`);

      await prisma.$transaction(async (tx) => {
        // Transition request to FAILED
        await StatusTransitionService.executeTransition(
          tx,
          requestId,
          RequestStatus.FAILED,
          null,
          executionResult.errorMessage
        );

        // Update Job record
        await tx.provisioningJob.update({
          where: { id: dbJob!.id },
          data: {
            status: JobStatus.FAILED,
            stage: 'FAILED',
            finishedAt: new Date(),
            errorMessage: executionResult.errorMessage,
            logs: executionResult.logs,
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            actorId: triggeredById || null,
            action: 'PROVISIONING_FAILED',
            entityType: 'ProvisioningJob',
            entityId: dbJob!.id,
            metadata: {
              requestId,
              errorMessage: executionResult.errorMessage,
            },
            result: 'FAILURE',
          },
        });
      });

      throw new Error(executionResult.errorMessage || 'Terraform provisioning failed');
    }
  },
  {
    connection: redisConnectionOptions,
    concurrency: 2,
  }
);

provisioningWorker.on('completed', (job) => {
  logger.info(`[Worker] Job ${job.id} completed successfully`);
});

provisioningWorker.on('failed', (job, err) => {
  logger.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
});

logger.info('🚀 InfraPilot Provisioning Worker running and listening for jobs...');
