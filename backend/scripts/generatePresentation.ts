import pptxgen from 'pptxgenjs';
import path from 'path';

async function generatePresentation() {
  console.log('📊 Generating InfraPilot 8-Slide Presentation...');

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 16:9 widescreen layout

  // Color Palette Constants
  const NAVY = '0F172A';
  const BLUE = '2563EB';
  const LIGHT_BLUE = 'DBEAFE';
  const SLATE = '475569';
  const LIGHT_BG = 'F8FAFC';
  const WHITE = 'FFFFFF';
  const GREEN = '059669';

  // Helper function for slide headers
  const addHeader = (slide: any, title: string, subtitle: string) => {
    // Top banner bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.15,
      fill: { color: BLUE },
    });

    slide.addText(title, {
      x: 0.8,
      y: 0.6,
      w: 11.5,
      h: 0.6,
      fontSize: 26,
      fontFace: 'Arial',
      bold: true,
      color: NAVY,
    });

    slide.addText(subtitle, {
      x: 0.8,
      y: 1.15,
      w: 11.5,
      h: 0.4,
      fontSize: 14,
      fontFace: 'Arial',
      color: SLATE,
    });
  };

  // ==========================================
  // SLIDE 1: Project Overview
  // ==========================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: NAVY };

  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.8,
    w: 0.2,
    h: 3.2,
    fill: { color: BLUE },
  });

  slide1.addText('InfraPilot', {
    x: 1.2,
    y: 1.8,
    w: 10,
    h: 1.0,
    fontSize: 48,
    fontFace: 'Arial',
    bold: true,
    color: WHITE,
  });

  slide1.addText('Enterprise Self-Service Infrastructure Management Platform', {
    x: 1.2,
    y: 2.8,
    w: 10,
    h: 0.6,
    fontSize: 22,
    fontFace: 'Arial',
    color: LIGHT_BLUE,
  });

  slide1.addText('Take-Home Technical Project | Senior IT Application Developer', {
    x: 1.2,
    y: 3.5,
    w: 10,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    color: '94A3B8',
  });

  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 1.2,
    y: 4.8,
    w: 10.5,
    h: 1.5,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 },
    rectRadius: 0.1,
  });

  slide1.addText(
    'Core Architecture: React 18 (Vite, TypeScript, Tailwind) • Node.js Express REST API (/api/v1) • PostgreSQL & Prisma ORM • Redis & BullMQ Worker • Terraform Automation (Safe Local Demo Provider)',
    {
      x: 1.5,
      y: 5.1,
      w: 9.9,
      h: 0.9,
      fontSize: 13,
      fontFace: 'Arial',
      color: 'E2E8F0',
      align: 'center',
    }
  );

  // ==========================================
  // SLIDE 2: Business Problem
  // ==========================================
  const slide2 = pptx.addSlide();
  slide2.background = { color: LIGHT_BG };
  addHeader(slide2, 'Business Problem & Enterprise Context', 'Challenges addressed in modern IT operations and infrastructure delivery');

  const challenges = [
    { title: 'Provisioning Bottlenecks', desc: 'Manual ticket-based VM requests result in multi-day lead times and development velocity drag.' },
    { title: 'Resource & Cost Sprawl', desc: 'Lack of automated governance and quota controls causes uncontrolled cloud compute sprawl and budget overruns.' },
    { title: 'Security & Shadow IT', desc: 'Developers bypassing IT policies to self-provision insecure servers without centralized oversight or compliance audit logs.' },
    { title: 'Operational Rigidity', desc: 'Disconnected deployment scripts with no standardized approval gates, lifecycle tracking, or rollback controls.' },
  ];

  challenges.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.8 + col * 5.8;
    const y = 1.9 + row * 2.3;

    slide2.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.4,
      h: 2.0,
      fill: { color: WHITE },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.1,
    });

    slide2.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: 0.12,
      h: 2.0,
      fill: { color: BLUE },
    });

    slide2.addText(`0${idx + 1}. ${item.title}`, {
      x: x + 0.3,
      y: y + 0.3,
      w: 4.8,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color: NAVY,
    });

    slide2.addText(item.desc, {
      x: x + 0.3,
      y: y + 0.8,
      w: 4.8,
      h: 0.9,
      fontSize: 13,
      color: SLATE,
      lineSpacing: 18,
    });
  });

  // ==========================================
  // SLIDE 3: Key Features & Capabilities
  // ==========================================
  const slide3 = pptx.addSlide();
  slide3.background = { color: LIGHT_BG };
  addHeader(slide3, 'Key Features & Platform Capabilities', 'Self-service provisioning workflow with end-to-end administrative oversight');

  const features = [
    { name: 'Self-Service Catalog', points: ['Standardized VM templates (OS, vCPU, RAM, Disk, Region)', 'Rigorous client & server-side Zod validation', 'Real-time user quota threshold checking'] },
    { name: 'Governance & Approvals', points: ['Role-Based Access Control (Developer vs. Admin)', 'Enforced separation of duties (no self-approvals)', 'Mandatory rejection justification & audit trails'] },
    { name: 'Automated Provisioning', points: ['Asynchronous job processing via BullMQ & Redis', 'Isolated child-process execution of Terraform demo HCL', 'Real-time stage updates & stdout/stderr log streaming'] },
    { name: 'Inventory & Lifecycle', points: ['Centralized inventory of provisioned instances', 'Simulated power actions (Start/Stop) with audit logs', 'Safe retry mechanisms for eligible failed workloads'] },
  ];

  features.forEach((feat, idx) => {
    const x = 0.8 + idx * 2.9;
    slide3.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.9,
      w: 2.7,
      h: 4.6,
      fill: { color: WHITE },
      line: { color: 'CBD5E1', width: 1 },
      rectRadius: 0.1,
    });

    slide3.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.15,
      y: 2.05,
      w: 2.4,
      h: 0.6,
      fill: { color: 'EFF6FF' },
      line: { color: 'BFDBFE', width: 1 },
      rectRadius: 0.05,
    });

    slide3.addText(feat.name, {
      x: x + 0.15,
      y: 2.1,
      w: 2.4,
      h: 0.5,
      fontSize: 12,
      bold: true,
      color: BLUE,
      align: 'center',
    });

    const bullets = feat.points.map((p) => `• ${p}`).join('\n\n');
    slide3.addText(bullets, {
      x: x + 0.2,
      y: 2.8,
      w: 2.3,
      h: 3.5,
      fontSize: 11,
      color: SLATE,
      lineSpacing: 16,
    });
  });

  // ==========================================
  // SLIDE 4: System Architecture
  // ==========================================
  const slide4 = pptx.addSlide();
  slide4.background = { color: LIGHT_BG };
  addHeader(slide4, 'System Architecture & Technical Design', 'Clean modular monolith REST API paired with a dedicated background automation worker');

  slide4.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.9,
    w: 5.6,
    h: 4.6,
    fill: { color: WHITE },
    line: { color: 'CBD5E1', width: 1 },
    rectRadius: 0.1,
  });

  slide4.addText('Core Architecture Layers', {
    x: 1.1,
    y: 2.1,
    w: 5.0,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: NAVY,
  });

  const archBullets = [
    'Client Tier: React 18 Single-Page Application (Vite, TypeScript, Tailwind CSS, Recharts for dynamic visual metrics).',
    'Application Tier: Express.js REST API (/api/v1) adopting modular service layers, centralized error handling, and Zod validation.',
    'Persistence Tier: PostgreSQL 14/15 managed with Prisma ORM migrations, transactions, and unique constraints.',
    'Messaging & Queue: Redis 7 and BullMQ for reliable job queueing and bounded exponential backoff retries.',
    'Worker Tier: Dedicated background provisioning process orchestrating isolated Terraform demo execution.',
  ];

  slide4.addText(archBullets.map((b) => `• ${b}`).join('\n\n'), {
    x: 1.1,
    y: 2.6,
    w: 5.0,
    h: 3.7,
    fontSize: 11,
    color: SLATE,
    lineSpacing: 15,
  });

  // Flow Diagram summary on right side
  slide4.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.9,
    w: 5.6,
    h: 4.6,
    fill: { color: '0F172A' },
    line: { color: '1E293B', width: 1 },
    rectRadius: 0.1,
  });

  slide4.addText('Synchronous API to Asynchronous Worker Flow', {
    x: 7.1,
    y: 2.1,
    w: 5.0,
    h: 0.4,
    fontSize: 15,
    bold: true,
    color: WHITE,
  });

  const steps = [
    '1. Developer submits VM request via React UI.',
    '2. REST API checks quotas and commits PENDING_APPROVAL state.',
    '3. Administrator approves request; DB transaction commits.',
    '4. API enqueues job into BullMQ queue with request ID.',
    '5. Worker consumes job; executes Terraform demo in sandbox.',
    '6. Outputs parsed; DB records updated; VM appears in Inventory.',
  ];

  slide4.addText(steps.join('\n\n'), {
    x: 7.1,
    y: 2.7,
    w: 5.0,
    h: 3.6,
    fontSize: 12,
    color: '94A3B8',
    lineSpacing: 18,
  });

  // ==========================================
  // SLIDE 5: Database Design & Request Workflow
  // ==========================================
  const slide5 = pptx.addSlide();
  slide5.background = { color: LIGHT_BG };
  addHeader(slide5, 'Database Design & Request Workflow', 'Normalized relational schema with explicit status transition enforcement');

  slide5.addTable(
    [
      [
        { text: 'Model Name', options: { bold: true, fill: { color: 'E2E8F0' } } },
        { text: 'Primary Keys & Relations', options: { bold: true, fill: { color: 'E2E8F0' } } },
        { text: 'Key Responsibilities & Constraints', options: { bold: true, fill: { color: 'E2E8F0' } } },
      ],
      ['User', 'id (UUID), email (Unique)', 'Stores credentials (bcrypt), role (DEVELOPER/ADMIN), relation to quotas.'],
      ['ResourceQuota', 'id, userId (Unique, 1-to-1)', 'Server-enforced limits for max VMs, CPU cores, RAM, and disk storage.'],
      ['InfrastructureRequest', 'id, requesterId (FK)', 'Stores requested VM specs, environment, justification, and workflow state.'],
      ['Approval', 'id, requestId (FK), approverId (FK)', 'Stores approval/rejection decision, mandatory comments, and decision timestamp.'],
      ['VirtualMachine', 'id, requestId (Unique FK)', 'Inventory record. Guaranteed 1-to-1 mapping with approved request.'],
      ['ProvisioningJob', 'id, requestId (FK)', 'Tracks BullMQ queue status, stage progression, attempts, and stdout/stderr logs.'],
      ['AuditLog', 'id, actorId (FK, nullable)', 'Immutable append-only record of logins, approvals, and power state actions.'],
    ],
    {
      x: 0.8,
      y: 1.9,
      w: 11.5,
      h: 4.5,
      fontSize: 10,
      color: NAVY,
      border: { pt: 1, color: 'CBD5E1' },
      align: 'left',
    }
  );

  // ==========================================
  // SLIDE 6: Terraform Automation & Jobs
  // ==========================================
  const slide6 = pptx.addSlide();
  slide6.background = { color: LIGHT_BG };
  addHeader(slide6, 'Terraform Automation & Asynchronous Jobs', 'Safe, deterministic local demo execution with comprehensive process sandboxing');

  const tfCards = [
    {
      title: 'Terraform Demo Provider',
      items: [
        'Uses HashiCorp Local Provider (hashicorp/local ~> 2.5.0) pinned with committed .terraform.lock.hcl.',
        'Simulates enterprise virtual machine deployment without generating cloud costs or external API dependencies.',
        'Deterministically computes realistic internal hostnames, IP allocations, and MAC addresses into JSON manifests.',
      ],
    },
    {
      title: 'Process Isolation & Sandboxing',
      items: [
        'Child process execution via child_process.spawn with shell: false to eliminate command injection vectors.',
        'Isolated runtime directory per job with scoped environment variables and execution timeout (60s).',
        'Multi-stage lifecycle: Validation -> Planning -> Applying -> Output Verification -> Inventory Synchronization.',
      ],
    },
    {
      title: 'Reliable Job Queue (BullMQ)',
      items: [
        'Queue name: "provisioning", powered by persistent Redis backend.',
        'Transactional enqueue guarantees jobs are not silently lost upon approval.',
        'Real-time stage streaming to UI with automatic exponential backoff for transient retries.',
      ],
    },
  ];

  tfCards.forEach((c, idx) => {
    const x = 0.8 + idx * 3.9;
    slide6.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.9,
      w: 3.7,
      h: 4.6,
      fill: { color: WHITE },
      line: { color: 'CBD5E1', width: 1 },
      rectRadius: 0.1,
    });

    slide6.addText(c.title, {
      x: x + 0.2,
      y: 2.1,
      w: 3.3,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: NAVY,
    });

    slide6.addText(c.items.map((i) => `• ${i}`).join('\n\n'), {
      x: x + 0.2,
      y: 2.7,
      w: 3.3,
      h: 3.6,
      fontSize: 11,
      color: SLATE,
      lineSpacing: 16,
    });
  });

  // ==========================================
  // SLIDE 7: Security & Comprehensive Testing
  // ==========================================
  const slide7 = pptx.addSlide();
  slide7.background = { color: LIGHT_BG };
  addHeader(slide7, 'Security Architecture & Automated Testing', 'Rigorous automated validation verifying all business rules, RBAC, and failure paths');

  slide7.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.9,
    w: 5.6,
    h: 4.6,
    fill: { color: WHITE },
    line: { color: 'CBD5E1', width: 1 },
    rectRadius: 0.1,
  });

  slide7.addText('Enterprise Security Controls', {
    x: 1.1,
    y: 2.1,
    w: 5.0,
    h: 0.4,
    fontSize: 15,
    bold: true,
    color: NAVY,
  });

  const secItems = [
    'Authentication: Secure JWT stored in HttpOnly, SameSite=Lax cookies with header fallback for API automation.',
    'Password Hashing: Salted bcrypt hashing with generic failure responses to prevent user enumeration.',
    'Rate Limiting: express-rate-limit configured on login endpoints (20 req / 15 min window) to thwart brute-force.',
    'Separation of Duties: Backend middleware strictly prohibits self-approval and cross-user data leakage.',
    'Append-Only Auditing: Immutable audit log capturing logins, approvals, rejections, power actions, and retries.',
  ];

  slide7.addText(secItems.map((s) => `• ${s}`).join('\n\n'), {
    x: 1.1,
    y: 2.6,
    w: 5.0,
    h: 3.7,
    fontSize: 11,
    color: SLATE,
    lineSpacing: 14,
  });

  slide7.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.9,
    w: 5.6,
    h: 4.6,
    fill: { color: WHITE },
    line: { color: 'CBD5E1', width: 1 },
    rectRadius: 0.1,
  });

  slide7.addText('13 Core Automated Tests (100% Passed)', {
    x: 7.1,
    y: 2.1,
    w: 5.0,
    h: 0.4,
    fontSize: 15,
    bold: true,
    color: GREEN,
  });

  const testList = [
    '✓ Rule 1: Successful login with metadata JWT',
    '✓ Rule 2: Rejection of invalid credentials',
    '✓ Rule 3: Blocking unauthenticated API access',
    '✓ Rule 4: Developer approval prohibition (RBAC)',
    '✓ Rule 5: Developer cross-request access isolation',
    '✓ Rule 6: Administrator global visibility authorization',
    '✓ Rule 7: Rejection of invalid resource specs (Zod)',
    '✓ Rule 8: Server-side quota over-allocation block',
    '✓ Rule 9: Double approval protection guarantee',
    '✓ Rule 10: Prohibition of rejected request provisioning',
    '✓ Rule 11: State machine invalid transition rejection',
    '✓ Rule 12: Failed jobs do not create active VM records',
    '✓ Rule 13: Audit events persisted for critical actions',
  ];

  slide7.addText(testList.join('\n'), {
    x: 7.1,
    y: 2.6,
    w: 5.0,
    h: 3.7,
    fontSize: 10,
    color: NAVY,
    lineSpacing: 16,
  });

  // ==========================================
  // SLIDE 8: Demo Results & Future Roadmap
  // ==========================================
  const slide8 = pptx.addSlide();
  slide8.background = { color: LIGHT_BG };
  addHeader(slide8, 'Demo Results & Future Roadmap', 'Delivered milestones and enterprise expansion opportunities');

  slide8.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.9,
    w: 5.6,
    h: 4.6,
    fill: { color: 'EFF6FF' },
    line: { color: 'BFDBFE', width: 1 },
    rectRadius: 0.1,
  });

  slide8.addText('Verified Deliverables Achieved', {
    x: 1.1,
    y: 2.1,
    w: 5.0,
    h: 0.4,
    fontSize: 15,
    bold: true,
    color: BLUE,
  });

  const achieved = [
    'Full-Stack Application: Responsive React frontend with real computed PostgreSQL metrics & Recharts graphs.',
    'Complete REST API: Modular architecture with Prisma transactions, BullMQ worker, and Zod validation.',
    'Real Terraform Workflow: Validates HCL, plans, applies local provider manifests, and syncs inventory.',
    'Dockerized Stack: docker-compose.yml orchestrating API, Worker, Frontend, PostgreSQL, and Redis.',
    'Comprehensive Docs: Architecture specs, database ER diagrams, API docs, demo guide, and CI pipeline.',
  ];

  slide8.addText(achieved.map((a) => `• ${a}`).join('\n\n'), {
    x: 1.1,
    y: 2.6,
    w: 5.0,
    h: 3.7,
    fontSize: 11,
    color: NAVY,
    lineSpacing: 15,
  });

  slide8.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.9,
    w: 5.6,
    h: 4.6,
    fill: { color: WHITE },
    line: { color: 'CBD5E1', width: 1 },
    rectRadius: 0.1,
  });

  slide8.addText('Future Production Enhancements', {
    x: 7.1,
    y: 2.1,
    w: 5.0,
    h: 0.4,
    fontSize: 15,
    bold: true,
    color: NAVY,
  });

  const roadmap = [
    'Multi-Cloud Providers: Terraform modules for AWS EC2, Azure VM, and GCP Compute Engine with remote state (S3/GCS).',
    'ChatOps Integration: Slack and Microsoft Teams webhooks with one-click interactive approval buttons.',
    'Automated Schedule Shutdowns: FinOps auto-stopping of non-production instances outside business hours.',
    'Cost Showback / Chargeback: Cost estimation before request submission and departmental budget allocation.',
    'SSO & IdP Integration: SAML 2.0 / OIDC integration with Okta, Azure AD, and corporate Active Directory.',
  ];

  slide8.addText(roadmap.map((r) => `• ${r}`).join('\n\n'), {
    x: 7.1,
    y: 2.6,
    w: 5.0,
    h: 3.7,
    fontSize: 11,
    color: SLATE,
    lineSpacing: 15,
  });

  // Save presentation
  const outputPath = path.resolve(__dirname, '../../docs/presentation.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`✅ Successfully generated presentation at: ${outputPath}`);
}

generatePresentation().catch((err) => {
  console.error('❌ Error generating presentation:', err);
  process.exit(1);
});
