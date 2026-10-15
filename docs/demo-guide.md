# InfraPilot — Interview Panel Demo Guide

This document provides an end-to-end walkthrough script for the interview panel to evaluate all required capabilities of **InfraPilot**.

---

## Demo Personas & Credentials

| Persona | Email | Password | Role | Focus Area |
| :--- | :--- | :--- | :--- | :--- |
| **Enterprise Admin** | `admin@infrapilot.local` | `AdminPass123!` | `ADMIN` | Approvals, Quotas, Audit Logs, Retries |
| **Senior Developer** | `developer@infrapilot.local` | `DevPass123!` | `DEVELOPER` | Self-Service VM Request, Tracking, Inventory |
| **DevOps Engineer** | `developer2@infrapilot.local` | `DevPass123!` | `DEVELOPER` | Isolation testing (cannot view peers' VMs) |

*(Note: On the login page, click the quick-login buttons to immediately fill credentials)*

---

## Step-by-Step Demonstration Flow

### Scene 1: Developer Self-Service & Quota Enforcement
1. Navigate to `http://localhost:5173/login`.
2. Click **Developer Demo** quick button, then click **Sign In**.
3. Point out:
   - Developer overview shows only their personal metrics (2 VMs, active requests).
   - Admin-only navigation links (Approvals, Audit Logs, Quotas) are hidden.
4. Click **Request VM** in the sidebar.
5. **Quota Enforcement Test**:
   - VM Name: `dev-huge-instance`
   - CPU: Select `16 Cores`
   - RAM: `32 GB`
   - Justification: `Testing high CPU request`
   - Click **Submit Request for Approval**.
   - **Result**: Immediate red error banner explaining that the requested CPU exceeds the developer's maximum permitted quota (16 cores total).
6. **Valid Submission**:
   - Change CPU to `2 Cores`, RAM to `4 GB`, Disk to `40 GB`.
   - Name: `dev-auth-service`.
   - Justification: `Authentication microservice cache node for testing authentication tokens`.
   - Click **Submit Request for Approval**.
   - **Result**: Successfully created with status `PENDING_APPROVAL` and redirected to Request Details.

---

### Scene 2: Administrative Review & Governance
1. Click **Log Out** in the bottom left.
2. Click **Admin Demo** quick button, then click **Sign In**.
3. Point out:
   - Admin overview displays global infrastructure metrics across all engineers.
   - Admin navigation tabs are visible: **Approvals**, **Audit Logs**, **Resource Quotas**.
4. Click **Approvals** in the sidebar.
5. Notice `dev-auth-service` is at the top of the queue with requester details, specs, and business justification.
6. Click **Approve**.
7. Enter comment: `Approved for development sprint duration` and click **Confirm Approval**.
8. **Result**: Status transitions to `APPROVED`, initial provisioning job record is created, and the job is enqueued to BullMQ.

---

### Scene 3: BullMQ & Terraform Automation Workflow
1. Navigate to **Provisioning Jobs** in the sidebar.
2. Notice the job has commenced:
   - Stage progresses: `VALIDATING` → `PLANNING` → `APPLYING` → `COMPLETED`.
   - Polling updates status in real-time.
3. Click **Logs** on the job row.
4. Point out the Terraform execution log:
   - Variable JSON validated.
   - Terraform schema verified.
   - Resource `local_file.vm_manifest` created with deterministic IP and MAC address.
   - JSON manifest verified.

---

### Scene 4: VM Inventory & Simulated Power Actions
1. Navigate to **VM Inventory** in the sidebar.
2. Notice `dev-auth-service` is now listed in the inventory table:
   - Power State: `RUNNING`
   - Provisioning Mode: `DEMO_TERRAFORM`
   - Simulated Resource badge clearly visible.
3. Click **Stop** on the instance.
4. Confirm dialog prompt.
5. **Result**: VM power state transitions to `STOPPED` and an audit event `VM_POWER_STOP` is recorded.
6. Click **Inspect** to examine host metadata, simulated IP, and MAC address.

---

### Scene 5: Failure Path & Safe Retry
1. Navigate to **Provisioning Jobs**.
2. Notice `dev-analytics-node` (seeded sample with status `FAILED`).
3. Click **Logs** to show the panel the error diagnostics (`Simulated network timeout during remote state coordination check`).
4. Click **Retry**.
5. **Result**: Status transitions to `QUEUED_FOR_RETRY` and request status resets to `PROVISIONING` safely without creating duplicate inventory items.

---

### Scene 6: Compliance Audit Logs & Resource Quotas
1. Click **Audit Logs**:
   - Filter by Action (e.g. `REQUEST_APPROVED`, `VM_POWER_STOP`).
   - Click **Payload** to inspect the structured metadata payload.
2. Click **Resource Quotas**:
   - Visual progress bars showing each developer's committed quota vs limit.
   - Click **Adjust Quota** on `Senior IT Developer` to scale their limit from 16 to 24 cores.
   - Click **Save Quota Configuration**.
   - Changes take effect immediately server-side.
