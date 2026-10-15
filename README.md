# InfraPilot — Enterprise Self-Service Infrastructure Management Portal

[![CI Pipeline](https://github.com/organization/infrapilot/actions/workflows/ci.yml/badge.svg)](https://github.com/organization/infrapilot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Terraform](https://img.shields.io/badge/Terraform-v1.9+-purple.svg)](https://www.terraform.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

InfraPilot is a production-grade, self-service infrastructure management portal inspired by enterprise provisioning platforms. It empowers developers to request virtual machines (VMs) while giving administrators complete governance, quota enforcement, approval workflows, automated Terraform execution, and centralized inventory tracking.

Developed as a technical take-home assignment demonstrating full-stack engineering, clean architecture, background job processing, and infrastructure automation for a **Senior IT Application Developer** role.

---

## 📑 Table of Contents
1. [Project Overview & Problem Statement](#1-project-overview--problem-statement)
2. [Key Features](#2-key-features)
3. [Architecture Summary](#3-architecture-summary)
4. [Technology Stack](#4-technology-stack)
5. [Prerequisites](#5-prerequisites)
6. [Installation & Setup](#6-installation--setup)
7. [Database Migrations & Seeding](#7-database-migrations--seeding)
8. [Demo Credentials](#8-demo-credentials)
9. [Running Automated Tests](#9-running-automated-tests)
10. [Docker & Containerized Deployment](#10-docker--containerized-deployment)
11. [Troubleshooting Guide](#11-troubleshooting-guide)
12. [Security Considerations](#12-security-considerations)
13. [Limitations & Future Enhancements](#13-limitations--future-enhancements)
14. [Deliverables Index](#14-deliverables-index)

---

## 1. Project Overview & Problem Statement

In enterprise IT environments, developers frequently encounter friction and delays waiting days for infrastructure requests to be manually approved and created via helpdesk tickets. Conversely, allowing unconstrained developer access to cloud platforms leads to security vulnerabilities, configuration drift, and runaway cloud costs.

**InfraPilot solves this dilemma by providing:**
- A self-service portal where engineers request validated compute templates.
- Enforced role-based access control (RBAC) and quota limits.
- A seamless approval workflow preventing duplicate provisioning.
- Asynchronous BullMQ background worker executing Terraform code in an isolated sandbox.
- Real-time inventory tracking with simulated power states (Start/Stop) and audit logging.

---

## 2. Key Features

- **Self-Service Infrastructure Requests**: Standardized templates (OS, vCPU, RAM, Disk, Region, Environment) validated via Zod schemas.
- **Resource Quotas & Capacity Enforcement**: Server-side quota validation blocks requests exceeding allocated user limits.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `DEVELOPER` and `ADMIN` roles. Developers only view their own requests and VMs; administrators manage the global fleet.
- **Strict Separation of Duties**: Developers cannot approve requests; administrators cannot approve their own requests.
- **State Machine Workflow**: Formally validated lifecycle (`DRAFT` → `PENDING_APPROVAL` → `APPROVED` → `PROVISIONING` → `ACTIVE` / `REJECTED` / `FAILED` / `CANCELLED`).
- **Terraform Automation**: Isolated execution running `terraform init`, `validate`, `plan`, and `apply` using the safe `hashicorp/local` provider to generate JSON manifests without cloud costs.
- **Asynchronous Processing (BullMQ & Redis)**: Dedicated background worker decoupling HTTP requests from infrastructure jobs.
- **Simulated VM Inventory & Power Lifecycle**: Interactive start/stop power operations with full audit log trails.
- **Interactive Dashboard Metrics**: Real-time aggregated statistics and visual breakdown charts powered by Recharts.
- **Immutable Audit Logging**: Append-only audit events tracking logins, requests, approvals, job retries, and power actions.

---

## 3. Architecture Summary

InfraPilot adopts a **Modular Monolith Architecture** for the REST API paired with a decoupled background worker:

```
Developer / Admin
       │ (HTTPS / REST)
       ▼
React 18 Frontend (Vite + Tailwind CSS + Recharts)
       │
       ▼
Express.js REST API (/api/v1)
 ├── Security Middleware (JWT, HttpOnly Cookie, Rate Limiting, RBAC)
 ├── Business Modules (Auth, Dashboard, Requests, Approvals, Inventory, Jobs, Audit, Quotas)
 └── Status Transition Service (State Machine)
       │                      │
       ▼ (Prisma Transactions)▼ (Reliable Enqueue)
PostgreSQL Database       Redis 7 + BullMQ ('provisioning' queue)
                              │
                              ▼ (Atomic Job Pop)
                      Provisioning Worker (Dedicated Node Process)
                              │
                              ▼ (Isolated Child Process: shell: false)
                      Terraform Demo Local Provider
                              │
                              ▼
                      Local VM Manifests (/manifests/vm-*.json)
```

For full architectural diagrams and lifecycle flows, see [docs/architecture.md](file:///c:/Nandhu/Infrastructure%20Management%20Tool/docs/architecture.md).

---

## 4. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS & Lucide React icons
- **Routing**: React Router v6
- **HTTP Client**: Axios with centralized error interceptors
- **Forms & Validation**: React Hook Form with Zod resolvers
- **Data Visualization**: Recharts for interactive analytics

### Backend
- **Runtime**: Node.js v22 (LTS) & Express.js
- **Language**: TypeScript
- **Validation**: Zod schema validation
- **Authentication**: JWT with secure `HttpOnly`, `SameSite=Lax` cookies & Bearer fallback
- **Security**: Helmet, bcryptjs (10 rounds), express-rate-limit

### Database & Background Jobs
- **Database**: PostgreSQL 14/15
- **ORM**: Prisma ORM with automated migrations & client generation
- **Cache & Queue**: Redis 7
- **Job Orchestration**: BullMQ (exponential backoff retries, concurrency controls)

### Infrastructure Automation & DevOps
- **IaC Tool**: HashiCorp Terraform (v1.5+)
- **Provider**: `hashicorp/local` provider (pinned in `.terraform.lock.hcl`)
- **Containerization**: Multi-stage Dockerfiles & Docker Compose
- **Continuous Integration**: GitHub Actions CI workflow

---

## 5. Prerequisites

- **Node.js**: v18.0.0 or higher (v22.x recommended)
- **npm**: v9.x or higher
- **PostgreSQL**: v14.x or higher (Running on localhost:5432)
- **Redis**: v6.x or higher (Running on localhost:6379)
- **Docker & Docker Compose**: Optional for containerized deployment

---

## 6. Installation & Setup

### Option A: Local Development (Host Machine)

1. **Clone the repository and install dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install
   ```

2. **Configure Environment Variables**:
   Copy the example environment files:
   ```bash
   # In root directory
   cp .env.example .env

   # In backend directory
   cp .env.example backend/.env
   ```
   *Ensure `DATABASE_URL` matches your local PostgreSQL credentials.*

3. **Database Initialization & Seeding**:
   ```bash
   cd backend
   npx prisma db push
   npm run db:seed
   ```

4. **Start the Backend REST API**:
   ```bash
   cd backend
   npm run dev
   # REST API available at http://localhost:5000/api/v1
   ```

5. **Start the BullMQ Provisioning Worker (in a separate terminal)**:
   ```bash
   cd backend
   npm run worker
   ```

6. **Start the Frontend Application**:
   ```bash
   cd frontend
   npm run dev
   # Frontend portal running at http://localhost:5173
   ```

---

## 7. Database Migrations & Seeding

The database includes built-in seed data representing realistic enterprise scenarios:
- **Pre-configured Users**: Enterprise Admin and Developer accounts.
- **Resource Quotas**: Pre-allocated quotas for CPU, RAM, disk, and instances.
- **Active Virtual Machines**: Running and stopped instances with simulated IP/MAC addresses.
- **Approval Queue**: Pending requests awaiting review.
- **Failed Job Sample**: A failed job (`dev-analytics-node`) ready for demoing safe retries.
- **Audit Logs**: Initial compliance trail events.

To reset and re-seed the database at any time:
```bash
npm run db:seed
```

---

## 8. Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Enterprise Admin** | `admin@infrapilot.local` | `AdminPass123!` | Global visibility, Approvals, Quotas, Audit Logs, Retries |
| **Senior IT Developer** | `developer@infrapilot.local` | `DevPass123!` | Self-Service VM Requests, Personal Inventory, Power State |
| **DevOps Engineer** | `developer2@infrapilot.local` | `DevPass123!` | Personal Inventory (isolated from Developer 1) |

*(Note: The login page includes quick-fill persona buttons for rapid demonstration)*

---

## 9. Running Automated Tests

InfraPilot includes a comprehensive test suite built with Vitest and Supertest covering all core business rules and security requirements:

```bash
# Run backend test suite
cd backend
npm test
```

### Verified Test Matrix (13 Core Rules):
- `Rule 1`: Successful authentication and JWT issuance
- `Rule 2`: Generic rejection of invalid credentials (no user enumeration)
- `Rule 3`: Blocking unauthenticated access to protected API endpoints
- `Rule 4`: RBAC enforcement prohibiting developers from approving requests
- `Rule 5`: Cross-user request access isolation
- `Rule 6`: Administrator authorization to inspect any request
- `Rule 7`: Strict rejection of invalid resource specifications (zero CPU, negative RAM)
- `Rule 8`: Server-side resource quota over-allocation enforcement
- `Rule 9`: Double-approval prevention guarantees
- `Rule 10`: Prohibition of rejected requests transitioning to provisioning
- `Rule 11`: State machine rejection of illegal status jumps
- `Rule 12`: Failed Terraform executions do not create falsely active VM records
- `Rule 13`: Immutable audit log persistence for sensitive lifecycle operations

---

## 10. Docker & Containerized Deployment

Run the complete 5-container infrastructure stack with a single command:

```bash
# Build and launch all services in detached mode
docker compose up -d --build
```

### Services Started:
1. `infrapilot-frontend`: React application served via high-performance Nginx (Port: 80).
2. `infrapilot-api`: Express.js REST API with healthchecks (Port: 5000).
3. `infrapilot-worker`: BullMQ background provisioning worker with embedded Terraform CLI.
4. `infrapilot-postgres`: PostgreSQL 15 Alpine database with persistent volume.
5. `infrapilot-redis`: Redis 7 Alpine message queue with persistent volume.

### View Logs & Stop Stack:
```bash
# Tail live container logs
docker compose logs -f

# Stop and remove containers safely
docker compose down
```

---

## 11. Troubleshooting Guide

- **PostgreSQL Connection Refused**:
  - Verify PostgreSQL is running: `Get-Service *postgres*` (Windows) or `systemctl status postgresql` (Linux).
  - Verify credentials in `.env` match `DATABASE_URL`.
- **Redis Connection Error**:
  - Ensure Redis is active: `docker run -d --name infrapilot-redis -p 6379:6379 redis:7-alpine`.
- **Terraform Binary Detection**:
  - The worker automatically detects local `terraform` CLI, falls back to Docker `hashicorp/terraform`, or uses the integrated deterministic demo driver.
- **Port Conflicts (5000 or 5173)**:
  - Configure alternate ports in `.env` or `vite.config.ts`.

---

## 12. Security Considerations

- **Process Isolation**: Child process execution runs with `shell: false` without arbitrary string concatenation.
- **No Secrets Committed**: `.env`, `.terraform`, and `*.tfstate` are strictly ignored in `.gitignore`.
- **Defense-in-Depth Auth**: JWT stored in `HttpOnly`, `SameSite=Lax` cookies; passwords hashed with `bcrypt`.
- **Auditing**: Sensitive parameters (passwords, tokens) are stripped before audit log persistence.
- **Safe Demo Mode**: Terraform execution uses the local provider to eliminate cloud cost exposure.

---

## 13. Limitations & Future Enhancements

### Current Limitations:
- Single-region local demo provider (simulated resources).
- Polling-based frontend updates instead of WebSockets.

### Production Roadmap:
- **Multi-Cloud Terraform Providers**: Real AWS EC2, Azure VM, and Google Cloud modules with remote S3 state locks.
- **ChatOps Integration**: Interactive Slack & Microsoft Teams approval notifications.
- **Automated FinOps Schedules**: Auto-stopping non-production instances outside business hours.
- **SSO / Enterprise IdP**: SAML 2.0 and OpenID Connect (OIDC) integration with Okta and Azure Active Directory.

---

## 14. Deliverables Index

- **System Architecture**: [docs/architecture.md](file:///c:/Nandhu/Infrastructure%20Management%20Tool/docs/architecture.md)
- **Database ER Design**: [docs/database-design.md](file:///c:/Nandhu/Infrastructure%20Management%20Tool/docs/database-design.md)
- **REST API Documentation**: [docs/api-documentation.md](file:///c:/Nandhu/Infrastructure%20Management%20Tool/docs/api-documentation.md)
- **Interview Demo Walkthrough**: [docs/demo-guide.md](file:///c:/Nandhu/Infrastructure%20Management%20Tool/docs/demo-guide.md)
- **8-Slide Presentation**: [docs/presentation.pptx](file:///c:/Nandhu/Infrastructure%20Management%20Tool/docs/presentation.pptx)
- **Implementation Status**: [docs/implementation-status.md](file:///c:/Nandhu/Infrastructure%20Management%20Tool/docs/implementation-status.md)
