# Demo script (2–5 minutes) — Team Task Manager

Use this after deploying to Railway. Replace `YOUR_APP_URL` with your live URL.

---

## 1. Intro (20 sec)

"This is a full-stack team task manager built with React, Express, PostgreSQL, and Prisma. It includes authentication, role-based access, projects, tasks, and a live dashboard."

Open: `https://YOUR_APP_URL`

---

## 2. Authentication (45 sec)

1. **Sign up** as first user → becomes **ADMIN**
2. Show dashboard loads with real stats
3. **Log out**
4. **Sign up** second user → **MEMBER**
5. **Log in** as admin again

Highlight: JWT session, protected routes, persistent login (refresh page while logged in).

---

## 3. Projects & team (60 sec)

**As admin:**

1. Create a project
2. Open project → **View tasks**
3. Add second user via **search** (registered users, no email invites)
4. Assign project role **MEMBER**

**As member (incognito or logout/login):**

1. Show only assigned projects visible
2. Cannot add/remove members or delete project

---

## 4. Tasks (60 sec)

**As project admin:**

1. Create task with priority, due date, assign to member
2. Filter by status / search
3. Edit task, change status

**As member:**

1. View project tasks
2. Update **status** on assigned task only
3. Show cannot delete or reassign

---

## 5. Dashboard & wrap (30 sec)

**As admin:** Show workspace-wide stats, overdue section, status bars.

**As member:** Show personal assigned metrics.

Close: "Deployed on Railway with PostgreSQL, automated migrations, and a single production service serving both API and frontend."

---

## Quick test URLs

| Check | URL |
|-------|-----|
| Health | `/api/health` |
| App | `/dashboard` |
| API root | `/api` (JSON when SERVE_CLIENT=false) |
