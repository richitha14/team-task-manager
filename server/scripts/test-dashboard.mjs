#!/usr/bin/env node
const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const PASSWORD = process.env.TEST_PASSWORD ?? "Password123";
const ts = Date.now();

let passed = 0;
let failed = 0;

function assert(c, m) {
  if (c) {
    passed++;
    console.log(`  ✓ ${m}`);
  } else {
    failed++;
    console.error(`  ✗ ${m}`);
  }
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function signup(email, name) {
  const r = await req("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password: PASSWORD }),
  });
  return r.body.token;
}

async function run() {
  console.log(`\nDashboard tests → ${BASE}\n`);

  const adminTok = await signup(`dash.admin.${ts}@ex.com`, "Dash Admin");
  const memberTok = await signup(`dash.member.${ts}@ex.com`, "Dash Member");

  // Admin dashboard
  const adminDash = await req("/api/dashboard", {
    headers: { Authorization: `Bearer ${adminTok}` },
  });
  assert(adminDash.status === 200, "admin dashboard loads");
  assert(adminDash.body.stats?.scope === "admin", "admin scope");
  const adminStats = adminDash.body.stats;

  // Create project + task as admin
  const proj = await req("/api/projects", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminTok}` },
    body: JSON.stringify({ name: "Dash Project" }),
  });
  const projectId = proj.body.project?.id;

  const search = await req(
    `/api/users/search?q=member&excludeProjectId=${projectId}`,
    { headers: { Authorization: `Bearer ${adminTok}` } },
  );
  const memberUser = search.body.users?.[0];

  await req(`/api/projects/${projectId}/members`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminTok}` },
    body: JSON.stringify({ userId: memberUser?.id, role: "MEMBER" }),
  });

  await req(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminTok}` },
    body: JSON.stringify({
      title: "Overdue task",
      dueDate: "2020-01-01",
      assigneeId: memberUser?.id,
    }),
  });

  await req(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminTok}` },
    body: JSON.stringify({
      title: "Done task",
      status: "COMPLETED",
      assigneeId: memberUser?.id,
    }),
  });

  const adminDash2 = await req("/api/dashboard", {
    headers: { Authorization: `Bearer ${adminTok}` },
  });
  const s2 = adminDash2.body.stats;
  assert(s2.tasks.total >= 2, "admin sees task count");
  assert(s2.tasks.overdue >= 1, "admin overdue count");
  assert(s2.tasks.completed >= 1, "admin completed count");
  assert(
    s2.tasks.pending === s2.tasks.byStatus.TODO + s2.tasks.byStatus.IN_PROGRESS,
    "pending = todo + in progress",
  );
  assert(s2.projects.total >= 1, "admin project count");

  // Member dashboard — scoped
  const memberDash = await req("/api/dashboard", {
    headers: { Authorization: `Bearer ${memberTok}` },
  });
  assert(memberDash.status === 200, "member dashboard loads");
  assert(memberDash.body.stats?.scope === "member", "member scope");
  const ms = memberDash.body.stats;
  assert(ms.projects.total >= 1, "member sees assigned project");
  assert(ms.tasks.assignedToMe >= 1, "member assigned count");
  assert(
    ms.recentTasks.every((t) => t.assigneeName === "Dash Member"),
    "member recent tasks are personal",
  );

  // Outsider sees no projects
  const outsiderTok = await signup(`dash.out.${ts}@ex.com`, "Outsider");
  const outDash = await req("/api/dashboard", {
    headers: { Authorization: `Bearer ${outsiderTok}` },
  });
  assert(outDash.body.stats?.projects.total === 0, "outsider has no projects");
  assert(outDash.body.stats?.tasks.total === 0, "outsider has no tasks");

  // Unauthenticated
  const noAuth = await req("/api/dashboard");
  assert(noAuth.status === 401, "dashboard requires auth");

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
