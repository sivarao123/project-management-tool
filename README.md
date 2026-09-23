# TaskFlow — Modern Full-Stack Project Management Tool
> *"Plan. Collaborate. Get Things Done."*

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black.svg)](https://socket.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan.svg)](https://tailwindcss.com)

A modern, production-grade project management application inspired by Trello and Asana, built specifically for the **CodeAlpha Full Stack Development — Task 3** assignment.

---

## 🌟 Key Features

### 1. Authentication & User Management
* **JWT-Based Authentication**: Secure token issuance, storage, and HTTP Authorization headers.
* **Password Hashing**: Industry-standard `bcryptjs` hashing with 10 salt rounds.
* **Protected & Public Route Guards**: React Router guards ensuring private tasks cannot be viewed without authentication.
* **Profile & Credentials Management**: Update name, bio, custom avatar URL, and change password.
* **1-Click Quick Demo Login**: One-click authentication buttons on the login screen for 3 pre-seeded team personas.

### 2. Interactive Kanban Project Board
* **5 Standard Workflow Columns**: `BACKLOG` → `TODO` → `IN PROGRESS` → `IN REVIEW` → `DONE`.
* **Smooth Drag & Drop**: Drag task cards between columns with instant position updates.
* **Visual Task Cards**: Priority indicators (Urgent 🔴, High 🟠, Medium 🔵, Low 🟢), due date alerts with overdue indicators, assignee avatars, labels, comment count, and attachment badges.
* **Inline Quick Creation**: Create tasks directly at the bottom of any column.

### 3. Comprehensive Task Details Modal
* **Editable Metadata**: Instant in-place title and description editing.
* **Properties Control**: Real-time status selector, priority picker, assignee assignment, and due date calendar.
* **Color-Coded Label Tags**: Add, toggle, or remove custom project labels (`Frontend`, `Backend`, `UI/UX`, `Bug`, `DevOps`).
* **File Attachments**: Upload documents, specs, or images (up to 10MB) via Multer with download and delete capabilities.
* **Audit History**: Chronological log of all status movements and modifications for the specific task.

### 4. Threaded Comments & Communication
* **Conversation-Style Interface**: Clean discussion feed with author avatars, names, and relative timestamps.
* **Nested Comment Replies**: Reply directly to existing comments to maintain coherent discussion threads.
* **CRUD Control**: Edit and delete your own comments with real-time synchronization.

### 5. Real-Time Collaboration (Socket.io)
* **Bidirectional WebSockets**: Connected peers join project rooms (`project:${id}`) and user rooms (`user:${id}`).
* **Multi-Window Sync**: When User A moves a card from `TODO` → `IN PROGRESS`, User B sees the card move immediately without refreshing the page!
* **Live Notifications**: Instant toast alerts when you are assigned a task or mentioned in a comment.
* **Presence Tracking**: Online/offline indicators showing active teammates.

### 6. Team & Role-Based Permissions
* **Granular Roles**: `Owner`, `Admin`, `Member`, and `Viewer`.
* **Access Control**: Viewers have read-only access; Members can manage tasks and comments; Admins and Owners can invite members, change roles, and configure project settings.
* **Member Management**: Invite colleagues by directory lookup or email, modify roles, or remove members.

### 7. Global Search & Filtering
* **Spotlight Search (`Cmd + K` / `Ctrl + K`)**: Instant modal search across Projects, Tasks, Team Members, and Discussion Comments.
* **Workspace Filters**: Filter by Status, Priority, Due Date, and Assignee.

### 8. Visual Task Calendar
* **Monthly Task Grid**: Visual calendar showing project milestones and task deadlines.
* **Click-to-Open**: Clicking any calendar deadline immediately opens the interactive Task Modal.

### 9. Productivity Dashboard
* **Workspace KPI Cards**: Total Projects, Active Projects, Completed Projects, Assigned Tasks, Due Today, Overdue Tasks.
* **Productivity Distribution Charts**: Visual breakdown of tasks by column status and priority urgency.
* **Live Recent Activity Stream**: Chronological feed of team actions across all projects.

### 10. Enterprise-Grade Agentic AI System ("TaskFlow Copilot / Nova")
* **Global Autonomous Copilot Drawer**: Accessible across all pages via floating badge, navbar button, or `⌘J` / `Ctrl+J`.
* **Multi-Step Reasoning Trace**: Transparent disclosure of agent execution steps (`[1. Parsing intent] -> [2. Querying PostgreSQL telemetry] -> [3. Synthesizing action plan]`).
* **Interactive Action Cards**: Proposed database modifications (creating sprint user stories, rebalancing team assignments, setting deadlines) render as interactive cards with a 1-click **"Apply to Board"** trigger.
* **In-Situ Kanban Sprint Copilot**: Launched directly from board toolbar:
  1. *Feature Decomposition*: Decomposes any product initiative into 4 sprint-ready user stories with acceptance criteria.
  2. *Sprint Health & Risks*: Proactively surfaces overdue items, completion velocity, and review bottlenecks.
  3. *Workload Balancer*: Evaluates team capacity distributions and recommends task rebalancing.
* **Task Modal AI Specification Enhancer**: 1-click **"✨ AI Enhance Specs"** on any task modal to generate detailed acceptance criteria, edge cases, and subtask checklists.
* **Dual-Core AI Engine**: Official Google GenAI SDK (`gemini-3.8-flash`) + Intelligent Autonomous Fallback Engine ensuring 100% functionality with or without external API keys.

---

## 🏗️ Architecture & Tech Stack

```
+-------------------------------------------------------------------------+
|                        React 18 + Vite Frontend                         |
|  Tailwind CSS | Lucide Icons | React Router | Axios | Socket.io Client  |
+-------------------------------------------------------------------------+
                                 ▲              ▲
                      REST HTTP  │              │ WebSockets
                      (JWT Auth) │              │ (Socket.io)
                                 ▼              ▼
+-------------------------------------------------------------------------+
|                       Express.js Backend Server                         |
|    JWT Auth Middleware | Role-Based Access Guards | Multer Storage      |
|    Controllers: Projects, Tasks, Comments, Notifications, Activities     |
+-------------------------------------------------------------------------+
                                 │
                                 ▼
+-------------------------------------------------------------------------+
|                      Relational Database Layer                          |
|  PostgreSQL (`pg`) with automatic embedded SQLite fallback              |
|  10 Relational Tables: users, projects, project_members, tasks, labels,  |
|  task_labels, comments, attachments, notifications, activity_logs       |
+-------------------------------------------------------------------------+
```

---

## 👥 Demo Accounts (Ready to Test)

The database is pre-seeded with 3 realistic team members and projects:

| Persona | Email | Password | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Morgan** | `alex@taskflow.dev` | `password123` | **Lead Owner** | Lead Product Manager & System Architect |
| **Sarah Chen** | `sarah@taskflow.dev` | `password123` | **Admin** | Senior UI/UX Designer |
| **John Doe** | `john@taskflow.dev` | `password123` | **Member** | Full Stack Engineer |

> **Pro Tip**: Use the **1-Click Quick Demo Login** buttons on the login screen to sign in instantly as any of these personas!

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [npm](https://www.npmjs.com/) (v9 or higher)
* Optional: PostgreSQL server (if you want to use external PostgreSQL rather than the embedded SQLite engine).

### 1. Installation
Install all dependencies for both backend and frontend:
```bash
npm run install:all
```

### 2. Seed Sample Data
Populate the database with realistic sample projects, Kanban tasks, comments, and users:
```bash
npm run seed
```

### 3. Start the Application
Start the TaskFlow server (serves both API, WebSockets, and the compiled React frontend):
```bash
npm run server
```
The application will be accessible at:
👉 **`http://localhost:5001`**

#### Optional: Frontend Hot-Reload Development Mode
If you wish to edit the frontend with Vite Hot Module Replacement (HMR):
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend Dev Server
npm run client
```
Access the Vite dev server at **`http://localhost:5173`**.

---

## 🧪 Automated Verification Suite

To run the automated end-to-end API test suite:
```bash
node test-api.js
```
This tests:
* API Health Check
* User Authentication & Session Verification
* Project Queries & Authorization
* Kanban Task Creation & Position Move
* Threaded Comments Creation & Retrieval
* Real-time Notifications & Global Search
* Task Lifecycle Deletion & Cascading

---

## 📡 REST API Reference

### Authentication
* `POST /api/auth/register` — Register new user
* `POST /api/auth/login` — Login with credentials and receive JWT
* `POST /api/auth/logout` — Logout user session
* `GET  /api/auth/me` — Get current user profile
* `PUT  /api/auth/profile` — Update profile info
* `PUT  /api/auth/password` — Change account password
* `POST /api/auth/forgot-password` — Request password reset
* `POST /api/auth/reset-password` — Complete password reset

### Projects
* `GET    /api/projects` — List user projects with task metrics
* `POST   /api/projects` — Create project
* `GET    /api/projects/:id` — Get project details, members, and labels
* `PUT    /api/projects/:id` — Update project metadata
* `DELETE /api/projects/:id` — Delete project (Owner only)
* `PUT    /api/projects/:id/archive` — Archive project
* `PUT    /api/projects/:id/restore` — Restore archived project

### Tasks & Kanban
* `GET    /api/projects/:projectId/tasks` — List all tasks for project Kanban
* `POST   /api/projects/:projectId/tasks` — Create task card
* `PUT    /api/projects/:projectId/tasks/reorder` — Batch reorder tasks during drag-and-drop
* `GET    /api/tasks/:id` — Get task details, attachments, comments, and history
* `PUT    /api/tasks/:id` — Update task title, status, priority, due date, assignee
* `DELETE /api/tasks/:id` — Delete task card
* `GET    /api/tasks/my-tasks` — Aggregated tasks assigned to current user

### Comments
* `GET    /api/tasks/:taskId/comments` — Get threaded comments
* `POST   /api/tasks/:taskId/comments` — Post comment or reply
* `PUT    /api/comments/:id` — Edit comment
* `DELETE /api/comments/:id` — Delete comment

### Project Members
* `GET    /api/projects/:id/members` — List project members and roles
* `POST   /api/projects/:id/members` — Invite/add member
* `PUT    /api/projects/:id/members/:userId` — Update member role
* `DELETE /api/projects/:id/members/:userId` — Remove member

### Notifications
* `GET    /api/notifications` — Get user notifications with unread count
* `PUT    /api/notifications/read-all` — Mark all notifications as read
* `PUT    /api/notifications/:id/read` — Mark notification as read
* `DELETE /api/notifications/:id` — Delete notification

### Global Search & Utilities
* `GET    /api/search?q=...` — Global multi-entity search
* `GET    /api/activities/global` — Recent team activity feed
* `GET    /api/users` — Team members directory
* `POST   /api/tasks/:taskId/attachments` — Upload file attachment
* `DELETE /api/attachments/:id` — Delete file attachment

### Agentic AI Endpoints
* `POST   /api/ai/agent` — Primary autonomous Copilot chat & multi-step command center
* `POST   /api/ai/breakdown` — Feature-to-backlog decomposition into user stories
* `POST   /api/ai/enhance-task` — Task specification, acceptance criteria & subtask generator
* `POST   /api/ai/standup` — Daily standup & sprint health intelligence report
* `POST   /api/ai/execute-actions` — Batched execution of approved AI action items into PostgreSQL

---

## 🧪 Comprehensive Automated Test Suites

TaskFlow includes 3 end-to-end automated verification suites:

```bash
# 1. Full REST API Verification (12/12 passing)
node test-api.js

# 2. Multi-Window Real-Time WebSocket Verification (12/12 passing)
node test-realtime.js

# 3. Autonomous Agentic AI Verification (13/13 passing)
node test-ai-agent.js
```

---

## 📄 License
This project is licensed under the MIT License — designed for the CodeAlpha Full Stack Development Internship program.
