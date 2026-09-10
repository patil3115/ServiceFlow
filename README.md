# ServiceFlow - Enterprise IT Service Desk & Incident Management Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/express-4.19.2-blue.svg)](https://expressjs.com/)
[![React Version](https://img.shields.io/badge/react-18.2.0-61dafb.svg)](https://react.dev/)
[![MongoDB Version](https://img.shields.io/badge/mongodb-7.0-green.svg)](https://www.mongodb.com/)
[![Docker Compose](https://img.shields.io/badge/docker--compose-v3.8-2496ed.svg)](https://docs.docker.com/compose/)
[![Architecture](https://img.shields.io/badge/architecture-Layered%20MVC%2FService-orange.svg)]()
[![License](https://img.shields.io/badge/license-ISC-lightgrey.svg)]()

> A production-grade, enterprise-ready IT Service Desk & Incident Management Platform engineered using a strict MERN stack (MongoDB, Express, React, Node.js). Built according to ITIL-inspired incident management principles, ServiceFlow enforces strict role-based access control, a deterministic ticket lifecycle state machine, real-time SLA breach telemetry, append-only immutable audit logging, and administrative governance safeguards.

---

## Table of Contents
1. [Overview & Product Vision](#1-overview--product-vision)
2. [User Roles & RBAC Matrix](#2-user-roles--rbac-matrix)
3. [Key Features](#3-key-features)
4. [Technology Stack & Architectural Principles](#4-technology-stack--architectural-principles)
5. [System Architecture](#5-system-architecture)
6. [Database Design & Data Models](#6-database-design--data-models)
7. [Ticket Lifecycle & State Machine](#7-ticket-lifecycle--state-machine)
8. [SLA Engine & Breach Telemetry](#8-sla-engine--breach-telemetry)
9. [Audit Logging & Timeline Narratives](#9-audit-logging--timeline-narratives)
10. [Administrative Governance & Safety Controls](#10-administrative-governance--safety-controls)
11. [REST API Documentation](#11-rest-api-documentation)
12. [Environment Variables](#12-environment-variables)
13. [Local Development Setup](#13-local-development-setup)
14. [Docker & Container Deployment](#14-docker--container-deployment)
15. [Automated Testing & Full Regression Suite](#15-automated-testing--full-regression-suite)
16. [Development Seed Accounts](#16-development-seed-accounts)
17. [Security Requirements & Defense in Depth](#17-security-requirements--defense-in-depth)
18. [Known Limitations & Future Improvements](#18-known-limitations--future-improvements)
19. [Author & License](#19-author--license)

---

## 1. Overview & Product Vision

In standard enterprise environments, chaotic ticket tracking results in missed SLAs, untracked operational costs, security blindspots, and frustrated employees. **ServiceFlow** solves these enterprise hurdles by modeling real-world IT service delivery:

- **Employees** can submit technical incidents, track SLA progress in real time, collaborate via chronologically ordered discussion threads, confirm resolutions, or reopen tickets if issues recur.
- **Support Agents** operate an operational triage queue, claim unassigned incidents, transition states (`ASSIGNED` → `IN_PROGRESS` → `PENDING` → `RESOLVED`), document diagnosis/resolution steps, and monitor approaching SLA deadlines.
- **Administrators** govern users, manage category taxonomies, safely elevate roles, toggle account statuses, inspect system-wide audit feeds, run SLA synchronization jobs, and view high-level analytics.

ServiceFlow is deliberately built with **zero external bloated dependencies** (No TypeScript, No Redux, No GraphQL, No Redis, No WebSockets), proving that a modern, robust, production-style web platform can be built with vanilla modern JavaScript, React Context API, and clean layered Node.js/Express architecture.

---

## 2. User Roles & RBAC Matrix

ServiceFlow strictly isolates data and operations through three role tiers:

| Capability / Resource | Employee | Support Agent | Administrator |
| :--- | :---: | :---: | :---: |
| **Create Incidents** | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Own Incidents** | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Other Employees' Incidents** | ❌ Blocked (403) | ✅ Yes | ✅ Yes |
| **Claim / Assign Tickets** | ❌ Blocked (403) | ✅ Yes | ✅ Yes |
| **Update Ticket Status (In Progress / Pending)** | ❌ Blocked (403) | ✅ Yes | ✅ Yes |
| **Resolve Incidents (With Notes)** | ❌ Blocked (403) | ✅ Yes | ✅ Yes |
| **Close Incident (Confirm Resolution)** | ✅ Creator Only | ✅ Assigned / Admin | ✅ Yes |
| **Reopen Incident (From Resolved)** | ✅ Creator Only | ✅ Assigned / Admin | ✅ Yes |
| **Post Comments** | ✅ Authorized Only | ✅ Yes | ✅ Yes |
| **View Audit Timeline** | ✅ Own Ticket Only | ✅ Yes | ✅ Yes |
| **Global Audit Stream (`/api/audit-logs`)** | ❌ Blocked (403) | ❌ Blocked (403) | ✅ Yes |
| **SLA Performance Report (`/api/sla/report`)** | ❌ Blocked (403) | ✅ Yes | ✅ Yes |
| **User Directory & Management (`/api/users`)** | ❌ Blocked (403) | ❌ Blocked (403) | ✅ Yes |
| **Role Escalation & Status Toggling** | ❌ Blocked (403) | ❌ Blocked (403) | ✅ Yes (Guarded) |

---

## 3. Key Features

- **Sequential Human-Readable Ticket Numbering**: Uses an atomic counter collection to generate formatted IDs like `INC-1001`, `INC-1002`, avoiding raw MongoDB ObjectIds in business workflows.
- **Multi-Role Dashboards**: Tailored real-time dashboard analytics for employees (personal ticket metrics), support agents (workload queues, SLA countdowns), and admins (system statistics, category distributions).
- **Dynamic SLA Engine**: Calculates SLA target deadlines based on ticket priority tier (`CRITICAL` = 2h, `HIGH` = 4h, `MEDIUM` = 8h, `LOW` = 24h), computes countdowns and elapsed breach times, and freezes clocks upon resolution.
- **Append-Only Immutable Audit Trail**: Tracks all changes with human-readable narratives (e.g. *"Sarah Connor changed status: ASSIGNED → IN_PROGRESS"*), with `updatedAt` disabled to prevent tamper/deletion.
- **Safety Safeguards (Last Active Admin Protection)**: Prevents demoting or deactivating the last active administrator in the database.
- **Full Server-Side Search, Filter & Pagination**: Composable queries supporting multi-field regex, priority filtering, category filtering, date ranges, and normalized pagination envelopes.
- **Enterprise Dark Slate UI**: High-contrast, clean SaaS styling built with pure CSS custom properties, responsive desktop-to-mobile layouts, interactive modals, confirmation dialogs, and skeleton loading states.

---

## 4. Technology Stack & Architectural Principles

### Frontend
- **React 18.2 (Vite 5)**: Fast ESM build tool and component tree.
- **React Router v6**: Client-side declarative routing with nested `ProtectedRoute` wrappers.
- **Context API (`AuthContext`)**: Lightweight global authentication state with localStorage sync.
- **Axios 1.6**: Centralized HTTP client configured with JWT interceptors.
- **Lucide React**: Crisp, modern SVG icons.
- **Vanilla Modern CSS**: Strict design token system with CSS custom properties (`var(--primary)`, `var(--bg-dark)`), flexbox/grid layouts, and zero CSS runtime overhead.

### Backend
- **Node.js (v20+) & Express 4.19**: High-performance HTTP application framework.
- **MongoDB 7.0 & Mongoose 8.3**: Document database with schema enforcement, compound indexes, text indexes, and middleware hooks.
- **JWT (`jsonwebtoken`) & bcryptjs**: Stateless token authentication and salt-hashed passwords.
- **Morgan & CORS**: Configured HTTP request logging and cross-origin resource isolation.

### Architectural Principles
1. **Layered MVC/Service Architecture**: Routes (`routes/`) delegating to thin Controllers (`controllers/`), which execute business logic inside Services (`services/`), interacting with Mongoose Models (`models/`).
2. **Defensive Error Handling**: Centralized error middleware handling operational `AppError`, Mongoose `CastError`, duplicate key errors (`11000`), and validation failures with sanitized client responses.
3. **No Forbidden Dependencies**: Avoided TypeScript, Redux, Redis, Kafka, and GraphQL to keep the stack straightforward, transparent, and easy to maintain.

---

## 5. System Architecture

```
+-------------------------------------------------------------------------+
|                               CLIENT (SPA)                              |
|   React (Vite) + React Router v6 + Axios + Context API + Modern CSS     |
|   - Multi-role dashboards (/dashboard, /tickets, /users, /sla)          |
|   - Responsive layout, interactive modals, status badges, timelines     |
+------------------------------------+------------------------------------+
                                     | JSON REST APIs (JWT Bearer Token)
                                     v
+-------------------------------------------------------------------------+
|                               SERVER (API)                              |
|   Node.js + Express.js (Layered MVC/Service Architecture)               |
|                                                                         |
|   Routes:                                                               |
|     ├── /api/auth       (Register, Login, Me)                           |
|     ├── /api/tickets    (CRUD, Status, Priority, Assign, SLA)           |
|     ├── /api/comments   (Ticket Discussion Threads)                     |
|     ├── /api/users      (Admin User Management)                         |
|     ├── /api/categories (Incident Categories)                          |
|     ├── /api/dashboard  (Multi-Role Analytics & Workload)              |
|     ├── /api/audit-logs (System-Wide Audit Stream)                      |
|     └── /api/sla        (SLA Reporting & Breach Synchronization)        |
|                                                                         |
|   Middleware Pipeline:                                                  |
|     Security Headers -> CORS -> Express JSON -> Morgan -> Router        |
|       └─> JWT Auth Middleware -> RoleGuard Middleware -> Controller     |
|             └─> Services Layer -> Centralized Error Middleware          |
+------------------------------------+------------------------------------+
                                     | Mongoose ODM
                                     v
+-------------------------------------------------------------------------+
|                             DATABASE (MongoDB)                          |
|   Collections: Users, Tickets, Comments, AuditLogs, Categories, Counters|
|   Indexes: Unique ticketNumber, Compound status/assignee, Text search   |
+-------------------------------------------------------------------------+
```

---

## 6. Database Design & Data Models

### 1. User (`server/models/User.js`)
- `name`: String, required.
- `email`: String, required, unique, lowercase.
- `password`: String, required (hashed with bcrypt, excluded in JSON responses).
- `role`: Enum (`EMPLOYEE`, `SUPPORT_AGENT`, `ADMIN`), default `EMPLOYEE`.
- `department`: String (e.g., Engineering, HR, Finance, IT).
- `isActive`: Boolean, default `true`.
- **Indexes**: `{ email: 1 }` (unique), `{ role: 1 }`, `{ isActive: 1 }`.

### 2. Ticket (`server/models/Ticket.js`)
- `ticketNumber`: String, unique (e.g. `INC-1001`), indexed.
- `title`: String, required, trimmed.
- `description`: String, required.
- `category`: String, required (e.g. Hardware, Software, Network).
- `priority`: Enum (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), default `MEDIUM`.
- `status`: Enum (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `PENDING`, `RESOLVED`, `CLOSED`), default `OPEN`.
- `createdBy`: ObjectId -> `User` (required).
- `assignedTo`: ObjectId -> `User` (null if unassigned).
- `slaDeadline`: Date, calculated upon ticket creation based on priority.
- `isSlaBreached`: Boolean, default `false`.
- `resolution`: Subdocument `{ notes: String, resolvedAt: Date, resolvedBy: ObjectId -> User }`.
- `closedAt`: Date, `closedBy`: ObjectId -> `User`.
- `reopenedAt`: Date, `reopenedReason`: String.
- **Indexes**: `{ ticketNumber: 1 }` (unique), `{ createdBy: 1, status: 1 }`, `{ assignedTo: 1, status: 1 }`, `{ status: 1, priority: 1 }`, `{ slaDeadline: 1, status: 1 }`, text index `{ ticketNumber: 'text', title: 'text', description: 'text' }`.

### 3. Comment (`server/models/Comment.js`)
- `ticketId`: ObjectId -> `Ticket` (indexed).
- `userId`: ObjectId -> `User` (author).
- `message`: String, required.
- `createdAt`: Date.

### 4. AuditLog (`server/models/AuditLog.js`)
- `ticketId`: ObjectId -> `Ticket` (optional, for ticket-scoped actions).
- `userId`: ObjectId -> `User` (actor).
- `action`: Enum (`TICKET_CREATED`, `TICKET_ASSIGNED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `TICKET_RESOLVED`, `TICKET_CLOSED`, `TICKET_REOPENED`, `COMMENT_ADDED`, `USER_ROLE_CHANGED`, `USER_STATUS_CHANGED`).
- `oldValue`: Mixed (prior state).
- `newValue`: Mixed (new state).
- `metadata`: Object (additional context like department, target user).
- `createdAt`: Date (strictly append-only; `updatedAt` disabled).

---

## 7. Ticket Lifecycle & State Machine

The ServiceFlow state machine follows strict transition rules:

```
                  +---------------------------+
                  |           OPEN            |
                  +-------------+-------------+
                                | (Assign Agent)
                                v
                  +---------------------------+
                  |         ASSIGNED          |
                  +-------------+-------------+
                                | (Start Work)
                                v
           +--------------------+--------------------+
           |                                         |
           v                                         v
+---------------------+                   +---------------------+
|     IN_PROGRESS     | <===============> |       PENDING       |
+----------+----------+  (Hold / Resume)  +---------------------+
           |
           | (Agent Resolves + Notes)
           v
+---------------------+
|      RESOLVED       | <===================================+
+----+-----------+----+                                     |
     |           |                                          |
     |           | (Employee Reopens with Reason)           | (Re-resolve)
     |           +------------------> [ IN_PROGRESS ] ------+
     |
     | (Employee Closes / Confirms)
     v
+---------------------+
|       CLOSED        | (TERMINAL STATE - Cannot be reopened)
+---------------------+
```

### Transition Validation Rules
- `OPEN` -> `ASSIGNED`: Requires assigning an active agent.
- `ASSIGNED` -> `IN_PROGRESS`: Support agent acknowledges ticket and begins diagnosis.
- `IN_PROGRESS` <-> `PENDING`: Placed on hold when waiting for vendor or employee information.
- `IN_PROGRESS` / `ASSIGNED` -> `RESOLVED`: Requires detailed resolution notes (`minlength: 5`). Sets `resolution.resolvedAt` and `resolution.resolvedBy`.
- `RESOLVED` -> `CLOSED`: Confirmation of resolution. Can be executed by ticket creator or administrator.
- `RESOLVED` -> `IN_PROGRESS`: Reopens incident if problem recurs. Requires `reason` string.
- `CLOSED` is a **terminal state**: Attempting to transition or reopen a `CLOSED` ticket returns `400 Bad Request`.

---

## 8. SLA Engine & Breach Telemetry

ServiceFlow computes SLA target deadlines automatically upon incident creation:

| Priority | Resolution Target | Urgency Calculation |
| :--- | :---: | :--- |
| **CRITICAL** | **2 Hours** | Immediate operational attention required |
| **HIGH** | **4 Hours** | High priority queue |
| **MEDIUM** | **8 Hours** | Standard business working day SLA |
| **LOW** | **24 Hours** | General technical support queue |

### Urgency Tiers & Telemetry
1. **NORMAL**: Remaining time > 60 minutes.
2. **WARNING**: Remaining time ≤ 60 minutes. Visual warning badge displayed.
3. **CRITICAL_WARNING**: Remaining time ≤ 30 minutes. Red alert badge displayed.
4. **BREACHED**: Target deadline passed. `isSlaBreached: true` set and flagged across queues.
5. **Freeze upon Resolution**: When a ticket reaches `RESOLVED` or `CLOSED`, the SLA clock is frozen at `resolvedAt`, recording whether the ticket was `RESOLVED_WITHIN_SLA` or `RESOLVED_BREACHED`.

---

## 9. Audit Logging & Timeline Narratives

Every significant action generates an append-only `AuditLog` entry. [auditService.js](file:///d:/IT%20Service%20Desk/server/services/auditService.js) transforms raw state transitions into human-friendly event narratives:

- `TICKET_CREATED`: *"John Doe created ticket INC-1001"*
- `TICKET_ASSIGNED`: *"Alex Vance assigned ticket to Sarah Connor"*
- `STATUS_CHANGED`: *"Sarah Connor changed status: ASSIGNED → IN_PROGRESS"*
- `PRIORITY_CHANGED`: *"Alex Vance changed priority: MEDIUM → CRITICAL"*
- `TICKET_RESOLVED`: *"Sarah Connor resolved the ticket"*
- `TICKET_REOPENED`: *"John Doe reopened the ticket (Reason: Port flapped again)"*
- `TICKET_CLOSED`: *"John Doe confirmed resolution and closed ticket"*
- `USER_ROLE_CHANGED`: *"Alex Vance changed user role from EMPLOYEE to SUPPORT_AGENT"*

---

## 10. Administrative Governance & Safety Controls

### Last-Admin Lockout Protection
To prevent accidental administrative lockout:
1. **Demotion Prevention**: If an admin attempts to demote their role (or another admin) and there is only 1 active administrator remaining, the server rejects the request with **`400 Bad Request`**:
   > *"Cannot demote the last active administrator. ServiceFlow requires at least one active administrator."*
2. **Deactivation Prevention**: If an admin attempts to deactivate the last active administrator account, the server rejects the request with **`400 Bad Request`**:
   > *"Cannot deactivate the last active administrator. ServiceFlow requires at least one active administrator."*

---

## 11. REST API Documentation

All protected endpoints require the HTTP header:
`Authorization: Bearer <JWT_TOKEN>`

### Authentication Endpoints

#### Register User
- **POST** `/api/auth/register`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Developer",
    "email": "jane@serviceflow.local",
    "password": "Password@123",
    "department": "Engineering"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "User registered successfully",
    "data": {
      "user": { "_id": "...", "name": "Jane Developer", "email": "jane@serviceflow.local", "role": "EMPLOYEE" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "employee@serviceflow.local",
    "password": "Employee@12345"
  }
  ```
- **Response (200 OK)**: Returns user object and JWT bearer token.

#### Get Current User Profile
- **GET** `/api/auth/me`
- **Auth**: Required (`EMPLOYEE`, `SUPPORT_AGENT`, `ADMIN`)
- **Response (200 OK)**: Returns authenticated user record.

---

### Incident Ticket Endpoints

#### Create Ticket
- **POST** `/api/tickets`
- **Auth**: Required (`EMPLOYEE`, `SUPPORT_AGENT`, `ADMIN`)
- **Request Body**:
  ```json
  {
    "title": "VPN connection drops every 10 minutes",
    "description": "Cisco AnyConnect disconnects intermittently while on office Wi-Fi.",
    "category": "Network",
    "priority": "HIGH",
    "department": "Engineering"
  }
  ```
- **Response (201 Created)**: Returns created ticket document with auto-generated `ticketNumber: "INC-1014"` and calculated `slaDeadline`.

#### List & Filter Tickets
- **GET** `/api/tickets?status=OPEN&priority=HIGH&page=1&limit=10&search=VPN`
- **Auth**: Required (Employees only receive their own tickets; Agents/Admins receive all matching tickets).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [ ...tickets ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalTickets": 1
    }
  }
  ```

#### Get Ticket Details
- **GET** `/api/tickets/:id` (Accepts MongoDB ObjectId or `INC-XXXX` number)
- **Auth**: Required (Employees can only access tickets they created; returns `403 Forbidden` on unauthorized access).

#### Update Ticket Status
- **PUT** `/api/tickets/:id/status`
- **Auth**: Required (`SUPPORT_AGENT`, `ADMIN`)
- **Request Body**: `{ "status": "IN_PROGRESS", "notes": "Investigating network logs" }`

#### Assign Ticket
- **PUT** `/api/tickets/:id/assign`
- **Auth**: Required (`SUPPORT_AGENT`, `ADMIN`)
- **Request Body**: `{ "assignedTo": "<agent_user_id>" }`

#### Resolve Ticket
- **PUT** `/api/tickets/:id/resolve`
- **Auth**: Required (`SUPPORT_AGENT`, `ADMIN`)
- **Request Body**: `{ "notes": "Reconfigured MTU settings on wireless controller." }`

#### Reopen Ticket
- **PUT** `/api/tickets/:id/reopen`
- **Auth**: Required (Ticket Creator or Admin)
- **Request Body**: `{ "reason": "Issue recurred after reboot." }`

#### Close Ticket
- **PUT** `/api/tickets/:id/close`
- **Auth**: Required (Ticket Creator or Admin)
- **Request Body**: `{ "reason": "Confirmed VPN connection is stable." }`

---

### Comments Endpoints

#### Add Comment
- **POST** `/api/tickets/:id/comments`
- **Auth**: Required (Authorized ticket participants)
- **Request Body**: `{ "message": "Updated router firmware to latest stable release." }`
- **Response (201 Created)**

#### Get Ticket Comments
- **GET** `/api/tickets/:id/comments`
- **Auth**: Required
- **Response (200 OK)**: Returns chronological array of comments with populated author details.

---

### SLA Telemetry & Reports

#### Ticket Live SLA Telemetry
- **GET** `/api/tickets/:id/sla`
- **Auth**: Required (Ticket creator, Agent, or Admin)
- **Response (200 OK)**: Returns deadline, target duration, elapsed minutes, remaining minutes, urgency tier, and human-readable summary.

#### SLA Compliance Performance Report
- **GET** `/api/sla/report`
- **Auth**: Required (`SUPPORT_AGENT`, `ADMIN`)
- **Response (200 OK)**: Returns overall compliance percentage, breakdown of resolved vs in-flight tickets, and breach metrics per priority tier.

#### Trigger SLA Breach Sync
- **POST** `/api/sla/sync`
- **Auth**: Required (`ADMIN`)
- **Response (200 OK)**: Scans in-flight incidents and marks breached tickets.

---

### User Governance Endpoints (Admin Only)

#### List Users
- **GET** `/api/users?role=SUPPORT_AGENT&isActive=true&search=Sarah`
- **Auth**: Required (`ADMIN`)

#### Update User Role
- **PATCH** `/api/users/:id/role`
- **Auth**: Required (`ADMIN`)
- **Request Body**: `{ "role": "SUPPORT_AGENT" }`

#### Update User Account Status
- **PATCH** `/api/users/:id/status`
- **Auth**: Required (`ADMIN`)
- **Request Body**: `{ "isActive": false }`

---

## 12. Environment Variables

### Backend Configuration (`server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/serviceflow
JWT_SECRET=serviceflow_enterprise_jwt_super_secret_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Frontend Configuration (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 13. Local Development Setup

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **MongoDB**: Local MongoDB instance running on port `27017`

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/your-username/serviceflow.git
cd serviceflow

# Install root, backend and frontend dependencies
npm run install:all
```

### Step 2: Seed Database
```bash
# Seeds default categories, users, sample incidents, and comments
npm run seed
```

### Step 3: Run Development Servers
In two separate terminals:

**Terminal 1 (Backend API):**
```bash
npm run server
# Runs Express on http://localhost:5000 with auto-reload
```

**Terminal 2 (Frontend Client):**
```bash
npm run client
# Runs Vite SPA on http://localhost:5173
```

Navigate to `http://localhost:5173` in your browser.

---

## 14. Docker & Container Deployment

ServiceFlow includes complete multi-container orchestration with persistent MongoDB storage.

```bash
# Build and launch client, server, and mongodb containers
docker compose up --build -d

# Check running containers
docker compose ps

# View application logs
docker compose logs -f server

# Stop containers
docker compose down
```

### Docker Services Exposed
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **MongoDB**: `localhost:27017` (Data volume: `serviceflow_mongo_data`)

---

## 15. Automated Testing & Full Regression Suite

ServiceFlow features a comprehensive 7-suite regression test runner verifying live HTTP endpoints:

```bash
# Run full regression test against active server
npm run test:regression --prefix server
```

### Test Coverage Highlights
- **Suite 1**: System health check reachability and Vite frontend server status.
- **Suite 2**: Authentication, bcrypt password verification, and registration role-escalation prevention.
- **Suite 3**: Ticket creation, auto-numbering format, and cross-employee 403 ownership isolation.
- **Suite 4**: 10-step finite state machine transition workflow, reopening reason tracking, and terminal state safeguards.
- **Suite 5**: Real-time SLA urgency calculation, performance reporting, and breach synchronization.
- **Suite 6**: Append-only audit timeline events and system-wide administrative audit stream queries.
- **Suite 7**: User management directory, role elevation, and last-active-admin lockout protections.

---

## 16. Development Seed Accounts

The seeder script (`server/scripts/seed.js`) populates the following accounts:

| Role | Name | Email | Password | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Alex Vance | `admin@serviceflow.local` | `Admin@12345` | IT Operations |
| **Support Agent** | Sarah Connor | `agent@serviceflow.local` | `Agent@12345` | Technical Support |
| **Employee 1** | John Doe | `employee@serviceflow.local` | `Employee@12345` | Engineering |
| **Employee 2** | Elena Rostova | `elena@serviceflow.local` | `Employee@12345` | Human Resources |

---

## 17. Security Requirements & Defense in Depth

- **Stateless Bearer JWT Authentication**: Cryptographically signed tokens with configurable expiration (`7d`).
- **One-Way Salted Password Hashing**: Passwords hashed using `bcryptjs` with 10 salt rounds; plaintext passwords never touch the database.
- **No Passwords in API Responses**: Mongoose schema overrides `toJSON` to permanently strip `password` and `__v` from returned user objects.
- **Authoritative Server-Side RBAC**: Frontend routing guards protect UX navigation; Express middleware (`protect` and `authorize`) strictly enforces permissions at the API layer.
- **Data Isolation & Ownership Guards**: Employees are restricted to viewing only incidents they created, preventing unauthorized horizontal privilege escalation.
- **Security Response Headers**: Injected `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and HSTS headers on all API responses.
- **Safe Production Error Responses**: Database stack traces, CastErrors, and internal MongoDB errors are sanitized before transmission to clients.

---

## 18. Known Limitations & Future Improvements

- **Polling vs WebSockets**: Real-time SLA countdowns and incident triage updates currently use periodic client-side polling and auto-fetch intervals. Future iterations could add WebSockets or Server-Sent Events (SSE).
- **Email Notifications**: Current incident updates generate audit log entries; production environments would link this to an SMTP or SendGrid notification service.
- **File Attachments**: Ticket descriptions and comments support text; integrating S3/object storage for screenshots and log attachments is a natural next step.
- **Horizontal Multi-Node Scalability**: The auto-increment ticket counter uses an atomic Mongoose `findOneAndUpdate` operation. For high-volume multi-region setups, distributed UUIDs or Snowflake IDs could be considered.

---

## 19. Author & License

- **Author**: Ashutosh Patil
- **Project**: ServiceFlow IT Service Desk & Incident Management Platform
- **License**: ISC License
