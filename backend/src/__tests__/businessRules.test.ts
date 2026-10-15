import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/database.js';
import { Role, RequestStatus, JobStatus } from '@prisma/client';
import { StatusTransitionService, StatusTransitionError } from '../services/statusTransitionService.js';
import { TerraformRunner } from '../services/terraformRunner.js';

describe('InfraPilot Core Business Rules & Security Suite', () => {
  let adminToken: string;
  let devToken: string;
  let dev2Token: string;
  let devUserId: string;
  let dev2UserId: string;
  let adminUserId: string;
  let devRequestId: string;
  let dev2RequestId: string;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@infrapilot.local',
      password: 'AdminPass123!',
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;
    adminUserId = adminRes.body.data.user.id;

    // 2. Authenticate Developer 1
    const devRes = await request(app).post('/api/v1/auth/login').send({
      email: 'developer@infrapilot.local',
      password: 'DevPass123!',
    });
    expect(devRes.status).toBe(200);
    devToken = devRes.body.data.token;
    devUserId = devRes.body.data.user.id;

    // 3. Authenticate Developer 2
    const dev2Res = await request(app).post('/api/v1/auth/login').send({
      email: 'developer2@infrapilot.local',
      password: 'DevPass123!',
    });
    expect(dev2Res.status).toBe(200);
    dev2Token = dev2Res.body.data.token;
    dev2UserId = dev2Res.body.data.user.id;

    // Find sample requests for developer 1 and developer 2
    const req1 = await prisma.infrastructureRequest.findFirst({
      where: { requesterId: devUserId },
    });
    if (req1) devRequestId = req1.id;

    const req2 = await prisma.infrastructureRequest.findFirst({
      where: { requesterId: dev2UserId },
    });
    if (req2) dev2RequestId = req2.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Successful login
  it('Rule 1: Should authenticate valid users and return JWT with user metadata', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'developer@infrapilot.local',
      password: 'DevPass123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('developer@infrapilot.local');
    expect(res.body.data.user.role).toBe(Role.DEVELOPER);
  });

  // 2. Invalid credentials
  it('Rule 2: Should reject invalid credentials with generic authentication message', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'developer@infrapilot.local',
      password: 'WrongPassword999!',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  // 3. Unauthenticated API access
  it('Rule 3: Should block unauthenticated access to protected endpoints', async () => {
    const res = await request(app).get('/api/v1/dashboard/summary');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 4. Developer cannot approve requests
  it('Rule 4: Developer cannot approve requests (RBAC restriction)', async () => {
    const res = await request(app)
      .post(`/api/v1/approvals/${devRequestId}/approve`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ comment: 'Illegal developer approval' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 5. Developer cannot access another user's request
  it("Rule 5: Developer cannot access another user's private request", async () => {
    if (!dev2RequestId) return;
    const res = await request(app)
      .get(`/api/v1/requests/${dev2RequestId}`)
      .set('Authorization', `Bearer ${devToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 6. Administrator can view authorized requests
  it("Rule 6: Administrator can view any requester's request", async () => {
    if (!dev2RequestId) return;
    const res = await request(app)
      .get(`/api/v1/requests/${dev2RequestId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(dev2RequestId);
  });

  // 7. Invalid resource values are rejected
  it('Rule 7: Invalid resource values (zero CPU, negative RAM) are strictly rejected by schema', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        name: 'test-invalid-specs',
        provider: 'Demo Provider',
        operatingSystem: 'Ubuntu 22.04 LTS',
        cpu: 0, // Invalid: min 1
        ramMb: 100, // Invalid: min 1024
        diskGb: 5, // Invalid: min 10
        region: 'us-east-1',
        environment: 'Development',
        justification: 'Short', // Invalid: min 10 chars
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  // 8. Quotas are enforced
  it('Rule 8: Resource quotas are enforced and prevent over-allocation', async () => {
    // Attempt to request 64 CPU when developer quota is 16 CPU
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        name: 'test-quota-breaker',
        provider: 'Demo Provider',
        operatingSystem: 'Ubuntu 22.04 LTS',
        cpu: 32, // Exceeds remaining developer quota
        ramMb: 32768,
        diskGb: 400,
        region: 'us-east-1',
        environment: 'Development',
        justification: 'Trying to request resources exceeding permitted quota limit',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/quota limit exceeded/i);
  });

  // 9. Requests cannot be approved twice
  it('Rule 9: Requests cannot be approved twice or after state transition', async () => {
    // Create a new fresh pending request by developer
    const createRes = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        name: 'test-double-approval',
        provider: 'Demo Provider',
        operatingSystem: 'Ubuntu 22.04 LTS',
        cpu: 1,
        ramMb: 1024,
        diskGb: 20,
        region: 'us-east-1',
        environment: 'Development',
        justification: 'Testing double approval protection mechanism',
      });

    expect(createRes.status).toBe(201);
    const newReqId = createRes.body.data.id;

    // First approval by Admin -> 200 OK
    const firstApproval = await request(app)
      .post(`/api/v1/approvals/${newReqId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comment: 'First valid approval' });

    expect(firstApproval.status).toBe(200);

    // Second approval on same request -> Must fail with 400
    const secondApproval = await request(app)
      .post(`/api/v1/approvals/${newReqId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comment: 'Duplicate second approval' });

    expect(secondApproval.status).toBe(400);
    expect(secondApproval.body.success).toBe(false);
    expect(secondApproval.body.message).toMatch(/cannot approve request with status/i);
  });

  // 10. Rejected requests cannot be provisioned
  it('Rule 10: Rejected requests cannot be approved or transitioned to provisioning', async () => {
    // Create request then reject it
    const createRes = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        name: 'test-reject-terminal',
        provider: 'Demo Provider',
        operatingSystem: 'Debian 12',
        cpu: 1,
        ramMb: 1024,
        diskGb: 20,
        region: 'us-west-2',
        environment: 'Testing',
        justification: 'Testing rejection terminal state guarantees',
      });

    const reqId = createRes.body.data.id;

    const rejectRes = await request(app)
      .post(`/api/v1/approvals/${reqId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comment: 'Policy non-compliance rejection' });

    expect(rejectRes.status).toBe(200);

    // Attempting to approve rejected request -> must fail
    const approveAfterReject = await request(app)
      .post(`/api/v1/approvals/${reqId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comment: 'Trying to approve after rejection' });

    expect(approveAfterReject.status).toBe(400);
    expect(approveAfterReject.body.success).toBe(false);
  });

  // 11. State Machine enforces strict transitions
  it('Rule 11: State Machine disallows illegal transitions (e.g. DRAFT -> ACTIVE directly)', () => {
    expect(() => {
      StatusTransitionService.validateTransition(RequestStatus.DRAFT, RequestStatus.ACTIVE);
    }).toThrow(StatusTransitionError);

    expect(() => {
      StatusTransitionService.validateTransition(RequestStatus.REJECTED, RequestStatus.APPROVED);
    }).toThrow(StatusTransitionError);
  });

  // 12. Safe Terraform runner and failure path
  it('Rule 12: Failed Terraform executions do not create falsely active inventory records', async () => {
    const runner = new TerraformRunner();
    // Intentionally pass an invalid CPU spec that fails validation
    const result = await runner.executeProvisioning({
      requestId: 'test-fail-999',
      vmName: 'fail-vm',
      operatingSystem: 'Ubuntu 22.04 LTS',
      cpu: 999, // Exceeds valid range
      ramMb: 2048,
      diskGb: 50,
      region: 'us-east-1',
      environment: 'Development',
      ownerEmail: 'developer@infrapilot.local',
    });

    expect(result.success).toBe(false);
    expect(result.stage).toBe('FAILED');
    expect(result.errorMessage).toBeDefined();

    // Verify no VirtualMachine record exists in database with this request ID
    const vm = await prisma.virtualMachine.findUnique({
      where: { requestId: 'test-fail-999' },
    });
    expect(vm).toBeNull();
  });

  // 13. Audit events are recorded for important actions
  it('Rule 13: Audit events are persisted for critical operations (login, request, approval)', async () => {
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['USER_LOGIN', 'REQUEST_CREATED', 'REQUEST_APPROVED'],
        },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    expect(recentAuditLogs.length).toBeGreaterThan(0);
    recentAuditLogs.forEach((log) => {
      expect(log.action).toBeDefined();
      expect(log.result).toBe('SUCCESS');
      expect(log.createdAt).toBeInstanceOf(Date);
    });
  });
});
