# TaskFlow — Enterprise Project Management Platform
> *"Plan. Collaborate. Get Things Done."*

[![Java 21](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://openjdk.org)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org)
[![Flyway](https://img.shields.io/badge/Flyway-Migrations-red.svg)](https://flywaydb.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8%20%2F%20Netty-black.svg)](https://socket.io)
[![Swagger](https://img.shields.io/badge/OpenAPI%203-Swagger%20UI-green.svg)](https://swagger.io)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan.svg)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**TaskFlow** is a modern, enterprise-grade project management application inspired by Linear, Notion, and Asana. It features fluid Kanban task orchestration, multi-window real-time WebSockets, fine-grained Role-Based Access Control (RBAC), and an autonomous AI Sprint Master ("Nova").

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   React 18 SPA (Vite + Tailwind CSS)                   │
│   Kanban Board • Modal Workspace • Team Directory • AI Copilot Modal   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  HTTP REST (Port 5001) / WebSocket (Port 9092)
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│              Java 21 LTS / Spring Boot 3 Backend Engine                │
│                                                                        │
│  [Spring Security 6]  Stateless JWT Authentication & RBAC Filters      │
│  [Spring Data JPA]    Entity-Repository Layer & Native SQL Dialect     │
│  [Netty-SocketIO]     Zero-Touch WebSocket Hub (Rooms & Presence)      │
│  [Flyway Migrations]  Automated Schema Versioning & Baseline DDL       │
│  [AI Sprint Engine]   Heuristic Decomposition & Telemetry Reasoner     │
│  [SpringDoc OpenAPI]  Interactive Swagger 3 UI (/swagger-ui.html)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                JDBC (Port 5432)
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    PostgreSQL 16 Database Cluster                      │
│    users • projects • project_members • tasks • comments •             │
│    attachments • notifications • activity_logs • labels                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Platform Capabilities

### 1. Interactive Kanban Workspace
* **5 Workflow Columns**: `BACKLOG` → `TODO` → `IN PROGRESS` → `IN REVIEW` → `DONE`.
* **Drag & Drop**: Smooth reordering with instant batch position recalculations.
* **Rich Task Cards**: Priority badges (Urgent 🔴, High 🟠, Medium 🔵, Low 🟢), overdue deadlines, assignee avatars, labels, comment count, and attachment badges.
* **Inline Quick Creation**: Create tasks directly from the base of any column.

### 2. Comprehensive Task Details & Collaboration
* **Live In-Place Editing**: Instant inline title and markdown description updates.
* **Properties Control**: Dynamic status selector, priority picker, assignee assignment, and due date calendar.
* **Labels & Taxonomy**: Color-coded project labels (`Frontend`, `Backend`, `UI/UX`, `Bug`, `DevOps`).
* **Media & File Attachments**: Upload documents, specs, or images (up to 10MB) with download and delete capabilities.
* **Threaded Discussions**: Nested comment threads with avatars, author tags, and instant WebSocket broadcasting.

### 3. Real-Time Collaboration & Telemetry
* **Live WebSockets**: Connected peers subscribe to project channels (`project:{id}`) and user channels (`user:{id}`).
* **Multi-Window Sync**: Instant state updates across browser tabs without manual page reloads.
* **Presence & Activity Tracking**: Online/offline status indicators and project audit feeds.
* **In-App Notification Center**: Real-time toast alerts for task assignments, comment mentions, and project invitations.

### 4. Enterprise Security & Access Control
* **Stateless JWT**: Standard Bearer token authentication with password hashing using BCrypt.
* **Role-Based Access Control (RBAC)**: `Owner`, `Admin`, `Member`, and `Viewer` security hierarchy.
* **Method-Level Security**: `@PreAuthorize("@projectSecurity.hasProjectRole(#projectId, 'MEMBER')")`.

### 5. Autonomous AI Sprint Copilot ("Nova")
* **Feature Decomposition**: Break down high-level features (e.g. *"OAuth2 Social Login"*) into sprint-ready user stories with acceptance criteria.
* **Sprint Health Briefing**: Real-time velocity, burndown, bottleneck alerts, and overdue ticket resolution.
* **Workload Balancing**: Automatically flags capacity imbalances across team members.
* **1-Click Batch Execution**: Apply AI-suggested actions directly into the database.

---

## 📊 Database Schema (Entity-Relationship)

```text
USERS (id, name, email, password_hash, avatar_url, role, bio, created_at, updated_at)
  │
  ├──< PROJECTS (id, name, description, color, priority, status, is_archived, owner_id)
  │      │
  │      ├──< PROJECT_MEMBERS (id, project_id, user_id, role, joined_at)
  │      ├──< LABELS (id, project_id, name, color)
  │      ├──< TASKS (id, project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
  │      │      │
  │      │      ├──< TASK_LABELS (task_id, label_id)
  │      │      ├──< COMMENTS (id, task_id, user_id, parent_id, content, created_at)
  │      │      └──< ATTACHMENTS (id, task_id, uploader_id, file_name, file_url, file_size, file_type)
  │      │
  │      └──< ACTIVITY_LOGS (id, project_id, user_id, action, entity_type, entity_id, metadata, created_at)
  │
  └──< NOTIFICATIONS (id, user_id, sender_id, type, title, message, link, is_read, created_at)
```

---

## 🚀 Quick Start Guide

### Option A: Complete Docker Orchestration (Recommended)
Launch the complete stack (PostgreSQL, Java Backend, and React Client) with a single command:

```bash
docker compose up --build
```

Access the application:
* **Web Application:** [http://localhost](http://localhost) (or [http://localhost:5173](http://localhost:5173))
* **Spring Boot REST API:** [http://localhost:5001](http://localhost:5001)
* **Swagger 3 Interactive Docs:** [http://localhost:5001/swagger-ui.html](http://localhost:5001/swagger-ui.html)
* **OpenAPI 3 JSON Schema:** [http://localhost:5001/api-docs](http://localhost:5001/api-docs)

---

### Option B: Local Development Setup

#### 1. Prerequisites
* **Java**: OpenJDK 21 LTS or higher
* **Maven**: 3.9+ (`mvn -v`)
* **Node.js**: v18+ and npm
* **PostgreSQL**: 16+ running on `localhost:5432` with database `taskflow`

#### 2. Start PostgreSQL
```bash
createdb taskflow
```

#### 3. Run Java Backend (Spring Boot 3)
```bash
cd backend-java
mvn clean spring-boot:run
```
*The backend automatically runs Flyway migrations, connects to PostgreSQL, starts Netty-SocketIO on port 9092, and starts HTTP on port 5001.*

#### 4. Run React Client
```bash
cd client
npm install
npm run dev
```
*Access the client at [http://localhost:5173](http://localhost:5173).*

---

## 🔑 Demo Personas & Credentials

You can use the 1-click quick login buttons on the login screen or sign in with:

| Persona | Role | Email | Password |
|---|---|---|---|
| **Alex Chen** | Product Lead (Admin) | `alex@taskflow.dev` | `password123` |
| **Sarah Jenkins** | Senior Full-Stack Engineer | `sarah@taskflow.dev` | `password123` |
| **Michael Torres** | UI/UX Designer | `michael@taskflow.dev` | `password123` |

---

## 🧪 Automated Testing

The backend includes a comprehensive unit test suite built with **JUnit 5 and Mockito**:

```bash
cd backend-java
mvn test
```

```text
[INFO] Running com.taskflow.backend.service.UserServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.taskflow.backend.service.CommentServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.taskflow.backend.service.AuthServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.taskflow.backend.service.NotificationServiceTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.taskflow.backend.service.AiAgentServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS (22 tests, 0 failures)
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
