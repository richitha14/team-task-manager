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
  const body =
    res.status === 204 ? {} : await res.json().catch(() => ({}));
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
  console.log(`\nTask tests → ${BASE}\n`);

  const adminTok = await signup(`task.admin.${ts}@ex.com`, "Task Admin");
  const memberTok = await signup(`task.member.${ts}@ex.com`, "Task Member");

  const proj = await req("/api/projects", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminTok}` },
    body: JSON.stringify({ name: "Task Project" }),
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

  // Admin creates task
  const created = await req(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminTok}` },
    body: JSON.stringify({
      title: "Test task",
      description: "Desc",
      priority: "HIGH",
      dueDate: "2020-01-01",
      assigneeId: memberUser?.id,
    }),
  });
  assert(created.status === 201, "admin creates task");
  const taskId = created.body.task?.id;
  assert(created.body.task?.isOverdue === true, "overdue detection");

  // Member cannot create
  const memberCreate = await req(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${memberTok}` },
    body: JSON.stringify({ title: "Nope" }),
  });
  assert(memberCreate.status === 403, "member cannot create tasks");

  // Member can list
  const list = await req(`/api/projects/${projectId}/tasks`, {
    headers: { Authorization: `Bearer ${memberTok}` },
  });
  assert(list.status === 200, "member can list tasks");

  // Member updates own assigned task status
  const statusUp = await req(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${memberTok}` },
    body: JSON.stringify({ status: "IN_PROGRESS" }),
  });
  assert(statusUp.status === 200, "assignee updates status");

  // Member cannot edit title
  const memberEdit = await req(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${memberTok}` },
    body: JSON.stringify({ title: "Hacked" }),
  });
  assert(memberEdit.status === 403, "member cannot edit task fields");

  // Member cannot delete
  const memberDel = await req(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${memberTok}` },
  });
  assert(memberDel.status === 403, "member cannot delete tasks");

  // Invalid assignee
  const badAssign = await req(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminTok}` },
    body: JSON.stringify({
      title: "Bad",
      assigneeId: "nonexistent-user-id",
    }),
  });
  assert(badAssign.status === 400 || badAssign.status === 404, "invalid assignee rejected");

  // Search filter
  const filtered = await req(
    `/api/projects/${projectId}/tasks?status=IN_PROGRESS&q=Test`,
    { headers: { Authorization: `Bearer ${adminTok}` } },
  );
  assert(
    filtered.body.tasks?.some((t) => t.id === taskId),
    "filter and search return task",
  );

  // Admin deletes
  const del = await req(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminTok}` },
  });
  assert(del.status === 204, "admin deletes task");

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
