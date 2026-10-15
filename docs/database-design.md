# InfraPilot — Database Design & Entity Relationship Specification

## 1. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o{ InfrastructureRequest : "submits"
    User ||--o{ Approval : "decides"
    User ||--o{ VirtualMachine : "owns"
    User ||--o{ AuditLog : "initiates"
    User ||--o| ResourceQuota : "constrained by"

    InfrastructureRequest ||--o{ Approval : "receives"
    InfrastructureRequest ||--o| VirtualMachine : "provisions"
    InfrastructureRequest ||--o{ ProvisioningJob : "triggers"
    InfrastructureRequest ||--o{ RequestStatusHistory : "tracks"

    User {
        String id PK "UUID"
        String name
        String email UK "Unique index"
        String passwordHash
        Role role "DEVELOPER | ADMIN"
        DateTime createdAt
        DateTime updatedAt
    }

    ResourceQuota {
        String id PK "UUID"
        String userId FK,UK "One-to-one with User"
        Int maxVms "Default: 5"
        Int maxCpu "Default: 16"
        Int maxRamMb "Default: 32768"
        Int maxDiskGb "Default: 500"
        DateTime createdAt
        DateTime updatedAt
    }

    InfrastructureRequest {
        String id PK "UUID"
        String requesterId FK
        String name
        String description
        String provider "Demo Provider"
        String operatingSystem
        Int cpu
        Int ramMb
        Int diskGb
        String region
        String environment
        String justification
        RequestStatus status "Indexed"
        DateTime createdAt "Indexed"
        DateTime updatedAt
    }

    Approval {
        String id PK "UUID"
        String requestId FK
        String approverId FK
        ApprovalDecision decision "APPROVED | REJECTED"
        String comment
        DateTime decidedAt
    }

    VirtualMachine {
        String id PK "UUID"
        String requestId FK,UK "Unique: 1 VM per request"
        String ownerId FK
        String name
        String hostname
        String operatingSystem
        String provider
        Int cpu
        Int ramMb
        Int diskGb
        String region
        String environment
        PowerState powerState "RUNNING | STOPPED | TERMINATED"
        String provisioningMode "DEMO_TERRAFORM"
        DateTime createdAt
        DateTime updatedAt
    }

    ProvisioningJob {
        String id PK "UUID"
        String requestId FK
        JobStatus status "QUEUED | IN_PROGRESS | COMPLETED | FAILED"
        Int attempts
        String stage
        DateTime startedAt
        DateTime finishedAt
        String errorMessage
        Text logs
        DateTime createdAt
        DateTime updatedAt
    }

    RequestStatusHistory {
        String id PK "UUID"
        String requestId FK
        RequestStatus fromStatus
        RequestStatus toStatus
        String changedById
        String reason
        DateTime createdAt
    }

    AuditLog {
        String id PK "UUID"
        String actorId FK "Nullable (System events)"
        String action "Indexed"
        String entityType "Indexed"
        String entityId
        Json metadata
        String result "SUCCESS | FAILURE"
        DateTime createdAt "Indexed"
    }
```

---

## 2. Relational Integrity & Constraints

1. **Unique Request-to-VM Mapping**:
   - `VirtualMachine.requestId` has a `@unique` index to physically guarantee that a single infrastructure request can never result in duplicate VM inventory records.
2. **Cascading Safety**:
   - Deleting a user cascade-cleans associated resource quotas and pending requests, but retains audit log history with `onDelete: SetNull` for actor IDs.
3. **Optimized Indexes**:
   - Compound and single-column indexes on `User(email)`, `InfrastructureRequest(requesterId, status, createdAt)`, `VirtualMachine(ownerId, powerState)`, and `AuditLog(actorId, action, entityType, createdAt)` ensure sub-millisecond query performance even under high request volumes.
4. **Calculated Aggregations vs. Stored Redundancy**:
   - Dashboard totals (such as total allocated vCPU, RAM, active VMs) are computed dynamically using aggregate database queries to prevent stale data discrepancies.
