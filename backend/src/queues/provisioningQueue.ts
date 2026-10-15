import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export interface ProvisioningJobData {
  requestId: string;
  triggeredById?: string;
  isRetry?: boolean;
}

export const PROVISIONING_QUEUE_NAME = 'provisioning';

export const provisioningQueue = new Queue<ProvisioningJobData>(PROVISIONING_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const enqueueProvisioningJob = async (
  requestId: string,
  triggeredById?: string,
  isRetry = false
) => {
  // Use requestId as the BullMQ jobId to guarantee deduplication and prevent concurrent duplicate enqueues
  const jobId = `provision-${requestId}-${isRetry ? Date.now() : 'initial'}`;
  
  logger.info(`Enqueuing provisioning job: ${jobId} for request ${requestId}`);
  
  const job = await provisioningQueue.add(
    'execute-provisioning',
    {
      requestId,
      triggeredById,
      isRetry,
    },
    {
      jobId,
    }
  );

  return job;
};
