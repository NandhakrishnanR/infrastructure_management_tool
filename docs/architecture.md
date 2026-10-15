# InfraPilot — System Architecture & Workflow Specification

## 1. Executive Summary

InfraPilot is a modular monolith self-service infrastructure management platform engineered for enterprise IT organizations. It bridges development teams needing rapid virtual machine provisioning with infrastructure administrators requiring strict governance, cost control, quota enforcement, and auditability.

---

## 2. High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Client Tier"]
        UI["React 18 + Vite + Tailwind CSS\n(SPA Dashboard & Self-Service Portal)"]
    end

    subgraph API_Tier["Application Tier (Modular Monolith)"]
        API["Express.js REST API Server\n(/api/v1)"]
        AuthMid["Security & RBAC Middleware\n(JWT, HttpOnly, RateLimit, Zod)"]
        StateEngine["Status Transition Engine\n(State Machine Service)"]
        API --> AuthMid --> StateEngine
    end

    subgraph Persistence["Persistence & Messaging Tier"]
        DB[(PostgreSQL 14/15\nPrisma ORM)]
        Queue[("Redis 7 + BullMQ\n('provisioning' Queue)")]
    end

    subgraph Async_Worker["Background Automation Tier"]
        Worker["BullMQ Provisioning Worker\n(Dedicated Node Process)"]
        TfRunner["Terraform Demo Runner\n(Isolated Child Process)"]
        Worker --> TfRunner
    end

    subgraph Infra_Tier["Infrastructure Automation"]
        TF["Terraform HCL Demo Provider\n(hashicorp/local v2.5.x)"]
        Manifests[("Isolated JSON VM Manifests\n/infrastructure/terraform/demo/manifests")]
        TfRunner --> TF --> Manifests
    end

    UI -- "HTTPS / JSON API" --> API
    API -- "Prisma Transactions" --> DB
    API -- "Reliable Enqueue" --> Queue
    Queue -- "Atomic Job Pop" --> Worker
    Worker -- "Job Status & Manifest Sync" --> DB
```

---

## 3. End-to-End Request & Provisioning Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant UI as React Frontend
    participant API as REST API (/api/v1)
    participant DB as PostgreSQL
    participant Q as Redis / BullMQ
    actor Admin as Administrator
    participant W as Provisioning Worker
    participant TF as Terraform Engine

    Dev->>UI: Submit VM Request (CPU, RAM, Disk, OS)
    UI->>API: POST /api/v1/requests
    API->>DB: Check Resource Quotas
    API->>DB: INSERT InfrastructureRequest (PENDING_APPROVAL)
    API-->>UI: 201 Created (Request ID)

    Admin->>UI: Review Pending Requests
    UI->>API: GET /api/v1/approvals/pending
    API-->>UI: Return List of Pending Requests

    Admin->>UI: Click "Approve Request"
    UI->>API: POST /api/v1/approvals/:id/approve
    API->>DB: BEGIN Transaction:
    Note over API,DB: 1. Status -> APPROVED<br/>2. Insert Approval Record<br/>3. Create ProvisioningJob (QUEUED)<br/>4. Append AuditLog
    API->>DB: COMMIT Transaction
    API->>Q: Enqueue 'execute-provisioning' Job
    API-->>UI: 200 OK (Job Enqueued)

    Q->>W: Dispatch Job (Request ID)
    W->>DB: Update Job Status -> IN_PROGRESS, Stage -> VALIDATING
    W->>TF: Run terraform validate
    W->>DB: Update Stage -> PLANNING
    W->>TF: Run terraform plan
    W->>DB: Update Stage -> APPLYING
    W->>TF: Run terraform apply (Local Manifest Generation)
    TF-->>W: Emit JSON Outputs (Hostname, IP, MAC)
    W->>DB: BEGIN Transaction:
    Note over W,DB: 1. Insert/Update VirtualMachine in Inventory<br/>2. Status -> ACTIVE<br/>3. Job -> COMPLETED<br/>4. Append AuditLog
    W->>DB: COMMIT Transaction
    W-->>Q: Job Complete Acknowledged

    Dev->>UI: Refresh / Poll Status
    UI->>API: GET /api/v1/inventory
    API-->>UI: Return Active VM Record
```

---

## 4. State Machine Transition Rules

The request lifecycle is governed strictly by `StatusTransitionService`:

| Source Status | Permitted Target Statuses | Trigger / Actor |
| :--- | :--- | :--- |
| `DRAFT` | `PENDING_APPROVAL`, `CANCELLED` | Developer submission or cancellation |
| `PENDING_APPROVAL` | `APPROVED`, `REJECTED`, `CANCELLED` | Admin approval/rejection or Developer cancellation |
| `APPROVED` | `PROVISIONING`, `FAILED` | Background Worker pickup or queue failure |
| `PROVISIONING` | `ACTIVE`, `FAILED` | Terraform apply success or execution failure |
| `ACTIVE` | `DECOMMISSIONED` | Authorized retirement of instance |
| `FAILED` | `PROVISIONING`, `CANCELLED` | Admin manual retry or cancellation |
| `REJECTED` | *None (Terminal)* | Terminal audit state |
| `CANCELLED` | *None (Terminal)* | Terminal audit state |
| `DECOMMISSIONED` | *None (Terminal)* | Terminal audit state |

---

## 5. Security & Isolation Architecture

1. **Child Process Isolation**:
   - Terraform commands run with fixed binaries, explicit argument arrays (`shell: false`), stripped environments, and execution timeouts (60s).
   - Prevents command injection and arbitrary shell concatenation.
2. **Separation of Duties (RBAC)**:
   - Developers cannot approve requests.
   - Administrators cannot approve their own submitted requests.
   - Developers cannot view or control another developer's VMs or requests.
3. **Defense-in-Depth Authentication**:
   - JWT stored in secure `HttpOnly`, `SameSite=Lax` cookies.
   - Password hashing using `bcrypt` (10 rounds).
   - Rate limiting on login endpoints (20 attempts per 15 minutes).
4. **Append-Only Auditing**:
   - System and user mutations record immutable audit events with actor, action, timestamp, and metadata.
