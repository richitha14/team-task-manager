# Submission readiness checklist

Use this before sharing your portfolio or submitting the assignment.

---

## Live deployment

- [ ] Railway app deployed and public URL accessible
- [ ] `GET /api/health` returns `"database":"connected"`
- [ ] Homepage / dashboard loads without errors
- [ ] HTTPS works (Railway default)

**Live URL:** _________________________________

---

## GitHub repository

- [ ] Code pushed to GitHub
- [ ] README.md complete with your URLs
- [ ] Screenshots added under `docs/screenshots/` (or remove placeholder table from README)
- [ ] No `.env` or secrets committed
- [ ] Repository description set (see below)
- [ ] Topics/tags added (see below)

**Repo URL:** _________________________________

---

## README placeholders updated

- [ ] Live demo URL
- [ ] GitHub repo link
- [ ] Demo video link (optional but recommended)
- [ ] Screenshot images

---

## Functional testing (live or local production)

### Authentication
- [ ] Signup works
- [ ] Login works
- [ ] Duplicate email rejected
- [ ] Protected routes redirect when logged out
- [ ] Session restore after page refresh
- [ ] Logout works

### RBAC
- [ ] First user is ADMIN
- [ ] Second user is MEMBER
- [ ] Member cannot access `/admin`
- [ ] Project member cannot manage members or delete project

### Projects
- [ ] Create / edit / delete project (as project admin)
- [ ] Search and add registered users to project
- [ ] Member list and role updates work

### Tasks
- [ ] Create task with assignee, priority, due date
- [ ] Filters and search work
- [ ] Project admin: full CRUD
- [ ] Member: status update on assigned task only
- [ ] Overdue tasks highlighted

### Dashboard
- [ ] Stats load from real database
- [ ] Admin vs member views differ appropriately
- [ ] Recent and overdue sections populate

---

## Technical checks

- [ ] No console errors on main flows (browser DevTools)
- [ ] React Router works on refresh (`/dashboard`, `/projects/:id/tasks`)
- [ ] `npm run build` succeeds locally
- [ ] API integration tests pass (optional):

```bash
npm run test:auth -w server
npm run test:projects -w server
npm run test:tasks -w server
npm run test:dashboard -w server
```

---

## Demo preparation

- [ ] Review [`scripts/DEMO_SCRIPT.md`](./scripts/DEMO_SCRIPT.md)
- [ ] Record 2–5 minute demo video (optional)
- [ ] Test demo flow once on live URL

---

## Suggested GitHub metadata

**Description:**
> Full-stack team task manager — React, Express, PostgreSQL, Prisma, JWT auth, RBAC, Railway deployment.

**Topics:**
`react` `typescript` `express` `postgresql` `prisma` `jwt` `rbac` `fullstack` `vite` `tailwindcss` `railway` `task-management` `rest-api` `monorepo`
