import { PrismaClient, Role, RequestStatus, ApprovalDecision, PowerState, JobStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for InfraPilot...');

  // Clean existing tables (in proper order for foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.requestStatusHistory.deleteMany();
  await prisma.provisioningJob.deleteMany();
  await prisma.virtualMachine.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.infrastructureRequest.deleteMany();
  await prisma.resourceQuota.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  // Password hashes
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  const devPasswordHash = await bcrypt.hash('DevPass123!', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Enterprise Admin',
      email: 'admin@infrapilot.local',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      quota: {
        create: {
          maxVms: 20,
          maxCpu: 64,
          maxRamMb: 131072,
          maxDiskGb: 2048,
        },
      },
    },
  });

  const developer = await prisma.user.create({
    data: {
      name: 'Senior IT Developer',
      email: 'developer@infrapilot.local',
      passwordHash: devPasswordHash,
      role: Role.DEVELOPER,
      quota: {
        create: {
          maxVms: 5,
          maxCpu: 16,
          maxRamMb: 32768,
          maxDiskGb: 500,
        },
      },
    },
  });

  const developer2 = await prisma.user.create({
    data: {
      name: 'DevOps Engineer',
      email: 'developer2@infrapilot.local',
      passwordHash: devPasswordHash,
      role: Role.DEVELOPER,
      quota: {
        create: {
          maxVms: 5,
          maxCpu: 16,
          maxRamMb: 32768,
          maxDiskGb: 500,
        },
      },
    },
  });

  console.log('👤 Created demo users (admin, developer, developer2).');

  // 2. Request 1: Active VM (Running)
  const req1 = await prisma.infrastructureRequest.create({
    data: {
      requesterId: developer.id,
      name: 'dev-api-gateway',
      description: 'Central API Gateway for internal microservices testing',
      provider: 'Demo Provider',
      operatingSystem: 'Ubuntu 22.04 LTS',
      cpu: 4,
      ramMb: 8192,
      diskGb: 100,
      region: 'us-east-1',
      environment: 'Development',
      justification: 'Required for testing API proxying and service discovery before staging rollout.',
      status: RequestStatus.ACTIVE,
      approvals: {
        create: {
          approverId: admin.id,
          decision: ApprovalDecision.APPROVED,
          comment: 'Approved standard development resource request.',
        },
      },
      virtualMachine: {
        create: {
          ownerId: developer.id,
          name: 'dev-api-gateway',
          hostname: 'demo-dev-dev-api-gateway.internal.infrapilot.local',
          operatingSystem: 'Ubuntu 22.04 LTS',
          provider: 'Demo Provider',
          cpu: 4,
          ramMb: 8192,
          diskGb: 100,
          region: 'us-east-1',
          environment: 'Development',
          powerState: PowerState.RUNNING,
          provisioningMode: 'DEMO_TERRAFORM',
        },
      },
      provisioningJobs: {
        create: {
          status: JobStatus.COMPLETED,
          attempts: 1,
          stage: 'COMPLETED',
          startedAt: new Date(Date.now() - 3600000),
          finishedAt: new Date(Date.now() - 3570000),
          logs: `[2026-10-15 08:30:00] [TerraformWorker] Initializing Terraform execution for request dev-api-gateway
[2026-10-15 08:30:02] [TerraformWorker] Generated terraform.tfvars.json with validated specs
[2026-10-15 08:30:05] [TerraformWorker] Executing 'terraform init' ... SUCCESS
[2026-10-15 08:30:10] [TerraformWorker] Executing 'terraform validate' ... SUCCESS
[2026-10-15 08:30:18] [TerraformWorker] Executing 'terraform plan' ... Plan: 1 to add, 0 to change, 0 to destroy.
[2026-10-15 08:30:28] [TerraformWorker] Executing 'terraform apply -auto-approve' ... Apply complete! Resources: 1 added.
[2026-10-15 08:30:30] [TerraformWorker] Outputs captured. Demo VM record synced to inventory. Status: ACTIVE`,
        },
      },
      statusHistory: {
        createMany: {
          data: [
            { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.PENDING_APPROVAL, changedById: developer.id, reason: 'Initial submission' },
            { fromStatus: RequestStatus.PENDING_APPROVAL, toStatus: RequestStatus.APPROVED, changedById: admin.id, reason: 'Approved by admin' },
            { fromStatus: RequestStatus.APPROVED, toStatus: RequestStatus.PROVISIONING, changedById: null, reason: 'Worker picked up job' },
            { fromStatus: RequestStatus.PROVISIONING, toStatus: RequestStatus.ACTIVE, changedById: null, reason: 'Terraform apply completed' },
          ],
        },
      },
    },
  });

  // 3. Request 2: Active VM (Stopped)
  const req2 = await prisma.infrastructureRequest.create({
    data: {
      requesterId: developer2.id,
      name: 'tst-cache-node',
      description: 'Distributed Redis cache benchmark instance',
      provider: 'Demo Provider',
      operatingSystem: 'RHEL 9',
      cpu: 2,
      ramMb: 4096,
      diskGb: 50,
      region: 'us-west-2',
      environment: 'Testing',
      justification: 'Performance stress test for tier-2 caching layer.',
      status: RequestStatus.ACTIVE,
      approvals: {
        create: {
          approverId: admin.id,
          decision: ApprovalDecision.APPROVED,
          comment: 'Approved for test sprint duration.',
        },
      },
      virtualMachine: {
        create: {
          ownerId: developer2.id,
          name: 'tst-cache-node',
          hostname: 'demo-tst-tst-cache-node.internal.infrapilot.local',
          operatingSystem: 'RHEL 9',
          provider: 'Demo Provider',
          cpu: 2,
          ramMb: 4096,
          diskGb: 50,
          region: 'us-west-2',
          environment: 'Testing',
          powerState: PowerState.STOPPED,
          provisioningMode: 'DEMO_TERRAFORM',
        },
      },
      provisioningJobs: {
        create: {
          status: JobStatus.COMPLETED,
          attempts: 1,
          stage: 'COMPLETED',
          startedAt: new Date(Date.now() - 7200000),
          finishedAt: new Date(Date.now() - 7180000),
          logs: `[2026-10-15 07:15:00] [TerraformWorker] Initializing Terraform execution for request tst-cache-node
[2026-10-15 07:15:05] [TerraformWorker] Initialized and validated.
[2026-10-15 07:15:15] [TerraformWorker] Apply complete. Demo VM provisioned.`,
        },
      },
    },
  });

  // 4. Request 3: Pending Approval
  await prisma.infrastructureRequest.create({
    data: {
      requesterId: developer.id,
      name: 'prd-payment-service',
      description: 'Production payment reconciliation microservice host',
      provider: 'Demo Provider',
      operatingSystem: 'Ubuntu 22.04 LTS',
      cpu: 4,
      ramMb: 8192,
      diskGb: 150,
      region: 'eu-west-1',
      environment: 'Production',
      justification: 'Critical business service: automated settlement and daily invoice parsing.',
      status: RequestStatus.PENDING_APPROVAL,
      statusHistory: {
        create: {
          fromStatus: RequestStatus.DRAFT,
          toStatus: RequestStatus.PENDING_APPROVAL,
          changedById: developer.id,
          reason: 'Submitted for manager approval',
        },
      },
    },
  });

  // 5. Request 4: Rejected Request
  await prisma.infrastructureRequest.create({
    data: {
      requesterId: developer2.id,
      name: 'dev-crypto-mining-sandbox',
      description: 'Ad-hoc computational experiment',
      provider: 'Demo Provider',
      operatingSystem: 'Ubuntu 22.04 LTS',
      cpu: 16,
      ramMb: 32768,
      diskGb: 500,
      region: 'us-east-1',
      environment: 'Development',
      justification: 'Testing heavy math algorithm calculations.',
      status: RequestStatus.REJECTED,
      approvals: {
        create: {
          approverId: admin.id,
          decision: ApprovalDecision.REJECTED,
          comment: 'Rejected: Resource allocation exceeds team development policy guidelines.',
        },
      },
      statusHistory: {
        createMany: {
          data: [
            { fromStatus: RequestStatus.DRAFT, toStatus: RequestStatus.PENDING_APPROVAL, changedById: developer2.id },
            { fromStatus: RequestStatus.PENDING_APPROVAL, toStatus: RequestStatus.REJECTED, changedById: admin.id, reason: 'Exceeded guidelines' },
          ],
        },
      },
    },
  });

  // 6. Request 5: Failed Provisioning Job (For retry demo)
  const failedReq = await prisma.infrastructureRequest.create({
    data: {
      requesterId: developer.id,
      name: 'dev-analytics-node',
      description: 'ETL Pipeline test container host',
      provider: 'Demo Provider',
      operatingSystem: 'Debian 12',
      cpu: 2,
      ramMb: 4096,
      diskGb: 60,
      region: 'ap-southeast-1',
      environment: 'Development',
      justification: 'Simulating data pipeline ingestion rate limits.',
      status: RequestStatus.FAILED,
      approvals: {
        create: {
          approverId: admin.id,
          decision: ApprovalDecision.APPROVED,
          comment: 'Approved by admin for data team.',
        },
      },
      provisioningJobs: {
        create: {
          status: JobStatus.FAILED,
          attempts: 1,
          stage: 'PLANNING',
          startedAt: new Date(Date.now() - 1800000),
          finishedAt: new Date(Date.now() - 1790000),
          errorMessage: 'Simulated network timeout during remote state coordination check.',
          logs: `[2026-10-15 09:10:00] [TerraformWorker] Starting job for dev-analytics-node
[2026-10-15 09:10:04] [TerraformWorker] Validating configuration ... OK
[2026-10-15 09:10:10] [TerraformWorker] Error: Simulated network timeout during remote state coordination check.
[2026-10-15 09:10:10] [TerraformWorker] Execution halted at stage PLANNING. Ready for safe retry.`,
        },
      },
    },
  });

  // 7. Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: admin.id,
        metadata: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0 Demo Browser' },
        result: 'SUCCESS',
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        actorId: developer.id,
        action: 'REQUEST_CREATED',
        entityType: 'InfrastructureRequest',
        entityId: req1.id,
        metadata: { vmName: 'dev-api-gateway', cpu: 4, ramMb: 8192 },
        result: 'SUCCESS',
        createdAt: new Date(Date.now() - 80000000),
      },
      {
        actorId: admin.id,
        action: 'REQUEST_APPROVED',
        entityType: 'InfrastructureRequest',
        entityId: req1.id,
        metadata: { comment: 'Approved standard development resource request.' },
        result: 'SUCCESS',
        createdAt: new Date(Date.now() - 79000000),
      },
      {
        actorId: null,
        action: 'PROVISIONING_COMPLETED',
        entityType: 'VirtualMachine',
        entityId: req1.id,
        metadata: { hostname: 'demo-dev-dev-api-gateway.internal.infrapilot.local' },
        result: 'SUCCESS',
        createdAt: new Date(Date.now() - 78500000),
      },
      {
        actorId: developer2.id,
        action: 'VM_POWER_STOP',
        entityType: 'VirtualMachine',
        entityId: req2.id,
        metadata: { reason: 'Scheduled idle shutdown' },
        result: 'SUCCESS',
        createdAt: new Date(Date.now() - 3600000),
      },
    ],
  });

  console.log('📝 Seeded initial audit logs.');
  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
