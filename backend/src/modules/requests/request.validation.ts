import { z } from 'zod';
import { RequestStatus } from '@prisma/client';

export const createRequestSchema = z.object({
  name: z
    .string()
    .min(3, 'VM name must be at least 3 characters')
    .max(50, 'VM name cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'VM name must only contain alphanumeric characters, hyphens, and underscores'),
  description: z.string().max(255).optional(),
  provider: z.literal('Demo Provider').default('Demo Provider'),
  operatingSystem: z.enum([
    'Ubuntu 22.04 LTS',
    'Ubuntu 24.04 LTS',
    'Debian 12',
    'RHEL 9',
    'Windows Server 2022',
  ]),
  cpu: z
    .number({ invalid_type_error: 'CPU must be a number' })
    .int()
    .min(1, 'CPU must be at least 1 core')
    .max(32, 'Maximum CPU is 32 cores for demo provisioning'),
  ramMb: z
    .number({ invalid_type_error: 'RAM must be a number' })
    .int()
    .min(1024, 'Minimum RAM is 1024 MB (1 GB)')
    .max(65536, 'Maximum RAM is 65536 MB (64 GB) for demo provisioning'),
  diskGb: z
    .number({ invalid_type_error: 'Disk must be a number' })
    .int()
    .min(10, 'Minimum Disk is 10 GB')
    .max(1000, 'Maximum Disk is 1000 GB (1 TB) for demo provisioning'),
  region: z.enum([
    'us-east-1',
    'us-west-2',
    'eu-west-1',
    'eu-central-1',
    'ap-southeast-1',
  ]),
  environment: z.enum(['Development', 'Testing', 'Production']),
  justification: z
    .string()
    .min(10, 'Business justification must be at least 10 characters long')
    .max(1000, 'Business justification cannot exceed 1000 characters'),
});

export const queryRequestsSchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  status: z.nativeEnum(RequestStatus).optional(),
  requesterId: z.string().optional(),
  provider: z.string().optional(),
  sortBy: z.enum(['createdAt', 'name', 'status', 'cpu', 'ramMb']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type QueryRequestsInput = z.infer<typeof queryRequestsSchema>;
