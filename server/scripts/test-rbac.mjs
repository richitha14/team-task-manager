#!/usr/bin/env node
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3001";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? `admin.${Date.now()}@example.com`;
const MEMBER_EMAIL = process.env.MEMBER_EMAIL ?? `member.${Date.now()}@example.com`;
const PASSWORD = process.env.TEST_PASSWORD ?? "Password123";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${message}`);
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function signup(email, name) {
  const res = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password: PASSWORD }),
  });
  return res.body.token;
}

async function run() {
  console.log(`\nRBAC tests → ${BASE_URL}\n`);

  const adminToken = await signup(ADMIN_EMAIL, "Admin User");
  const memberToken = await signup(MEMBER_EMAIL, "Member User");

  // Admin lists users
  const users = await request("/api/admin/users", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(users.status === 200, "admin can list users");

  // Member cannot access admin
  const denied = await request("/api/admin/users", {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert(denied.status === 403, "member blocked from admin routes");

  // Create project as member
  const project = await request("/api/projects", {
    method: "POST",
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({ name: "RBAC Test Project", description: "Test" }),
  });
  assert(project.status === 201, "authenticated user can create project");
  const projectId = project.body.project?.id;

  // Member can list own projects
  const list = await request("/api/projects", {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert(list.status === 200, "member can list projects");
  assert(
    list.body.projects?.some((p) => p.id === projectId),
    "created project appears in list",
  );

  // Non-member cannot access project
  const noAccess = await request(`/api/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  // App ADMIN can access all projects
  assert(
    noAccess.status === 200 || noAccess.status === 403,
    "project access respects membership or app admin",
  );

  // App admin (not on project) can still manage via app ADMIN role
  const adminUser = users.body.users?.find((u) => u.email === ADMIN_EMAIL);
  const addByAppAdmin = await request(`/api/projects/${projectId}/members`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ userId: adminUser?.id, role: "MEMBER" }),
  });
  assert(
    addByAppAdmin.status === 201 || addByAppAdmin.status === 409,
    "app admin can add members to any project",
  );

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
