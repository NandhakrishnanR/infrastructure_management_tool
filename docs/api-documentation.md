# InfraPilot — REST API Documentation (v1)

Base URL: `/api/v1`  
Authentication: `HttpOnly` Cookie (`token`) OR `Authorization: Bearer <JWT>` header.

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/login`
- **Description**: Authenticate user credentials and establish session.
- **Access**: Public (Rate limited: 20 req/15 min)
- **Request Body**:
  ```json
  {
    "email": "developer@infrapilot.local",
    "password": "DevPass123!"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "uuid",
        "name": "Senior IT Developer",
        "email": "developer@infrapilot.local",
        "role": "DEVELOPER"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{"success": false, "message": "Invalid email or password"}`
  - `429 Too Many Requests`: `{"success": false, "message": "Too many login attempts..."}`

### `POST /api/v1/auth/logout`
- **Description**: Invalidate cookie session.
- **Access**: Authenticated

### `GET /api/v1/auth/me`
- **Description**: Retrieve currently authenticated user context and quotas.
- **Access**: Authenticated

---

## 2. Dashboard Endpoints

### `GET /api/v1/dashboard/summary`
- **Description**: Computed counts for VMs, pending requests, failed jobs, and allocated compute/memory.
- **Access**: Authenticated (Scoped: Developers see own metrics; Admins see global metrics)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "metrics": {
        "totalVms": 2,
        "runningVms": 1,
        "stoppedVms": 1,
        "pendingRequests": 1,
        "approvedRequests": 2,
        "failedJobs": 1,
        "totalCpuAllocated": 6,
        "totalRamMbAllocated": 12288,
        "totalDiskGbAllocated": 150
      },
      "recentRequests": [...],
      "recentAuditLogs": [...]
    }
  }
  ```

### `GET /api/v1/dashboard/charts`
- **Description**: Recharts-formatted aggregations for VM power status, requests by status, and environment distribution.

---

## 3. Infrastructure Requests Endpoints

### `GET /api/v1/requests`
- **Description**: Paginated list of infrastructure requests.
- **Query Parameters**:
  - `page` (default 1)
  - `limit` (default 10)
  - `search` (filter by name/description)
  - `status` (PENDING_APPROVAL, APPROVED, ACTIVE, etc.)
  - `provider`
- **Access**:
  - `DEVELOPER`: Strictly returns user's own requests.
  - `ADMIN`: Returns all requests, supports filtering by `requesterId`.

### `POST /api/v1/requests`
- **Description**: Create and submit a virtual machine provisioning request.
- **Access**: Authenticated
- **Validation**: Enforces CPU (1-32), RAM (1024-65536 MB), Disk (10-1000 GB), and checks user quota limits.
- **Request Body**:
  ```json
  {
    "name": "dev-api-gateway",
    "description": "Central API Gateway host",
    "provider": "Demo Provider",
    "operatingSystem": "Ubuntu 22.04 LTS",
    "cpu": 4,
    "ramMb": 8192,
    "diskGb": 100,
    "region": "us-east-1",
    "environment": "Development",
    "justification": "Required for internal microservice gateway testing"
  }
  ```
- **Success Response (201 Created)**

### `GET /api/v1/requests/:id`
- **Description**: Request details, specifications, approval decisions, job status, and status history.
- **Access**: Owner or Administrator

### `POST /api/v1/requests/:id/cancel`
- **Description**: Cancel a pending or draft request.
- **Access**: Requester or Administrator

---

## 4. Approval Management Endpoints

### `GET /api/v1/approvals/pending`
- **Description**: List requests awaiting administrative review.
- **Access**: Administrator (`ADMIN`) only

### `POST /api/v1/approvals/:id/approve`
- **Description**: Approve request, commit transaction, and enqueue BullMQ job.
- **Access**: Administrator (`ADMIN`) only
- **Validation**: Requesters cannot approve their own requests.
- **Request Body**:
  ```json
  {
    "comment": "Approved per sprint resource budget authorization"
  }
  ```

### `POST /api/v1/approvals/:id/reject`
- **Description**: Reject request with mandatory reason.
- **Access**: Administrator (`ADMIN`) only
- **Request Body**:
  ```json
  {
    "comment": "Exceeds resource quota guidelines for sandbox testing"
  }
  ```

---

## 5. VM Inventory Endpoints

### `GET /api/v1/inventory`
- **Description**: List provisioned simulated virtual machines.
- **Access**: Scoped by role

### `GET /api/v1/inventory/:id`
- **Description**: Inspect single VM details and host specifications.

### `POST /api/v1/inventory/:id/power`
- **Description**: Safe simulated power toggle (start, stop, restart).
- **Access**: Owner or Administrator
- **Request Body**:
  ```json
  {
    "action": "START"
  }
  ```

---

## 6. Provisioning Jobs Endpoints

### `GET /api/v1/jobs`
- **Description**: List background jobs with stages and statuses.

### `GET /api/v1/jobs/:id`
- **Description**: Inspect full job details including live execution logs and error diagnostics.

### `POST /api/v1/jobs/:id/retry`
- **Description**: Trigger safe retry for eligible failed jobs.
- **Access**: Administrator (`ADMIN`) only

---

## 7. Audit & Quota Endpoints (Admin Only)

### `GET /api/v1/audit-logs`
- **Description**: Paginated, filterable immutable audit trail.
- **Access**: Administrator (`ADMIN`) only

### `GET /api/v1/quotas`
- **Description**: List users with assigned quota limits and live usage statistics.
- **Access**: Administrator (`ADMIN`) only

### `PUT /api/v1/quotas/:userId`
- **Description**: Update user resource thresholds.
- **Request Body**:
  ```json
  {
    "maxVms": 8,
    "maxCpu": 24,
    "maxRamMb": 49152,
    "maxDiskGb": 750
  }
  ```
