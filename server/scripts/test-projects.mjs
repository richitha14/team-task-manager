#!/usr/bin/env node
/**
 * Project & team permission tests — requires API + PostgreSQL.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const PASSWORD = process.env.TEST_PASSWORD ?? "Password123";
const ts = Date.now();

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
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
  console.log(`\nProject tests → ${BASE}\n`);

  const adminEmail = `proj.admin.${ts}@example.com`;
  const memberEmail = `proj.member.${ts}@example.com`;
  const outsiderEmail = `proj.out.${ts}@example.com`;

  const adminToken = await signup(adminEmail, "Proj Admin");
  const memberToken = await signup(memberEmail, "Proj Member");
  const outsiderToken = await signup(outsiderEmail, "Outsider");

  // Create project as first user (app admin)
  const created = await req("/api/projects", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "Phase 3 Project", description: "Test" }),
  });
  assert(created.status === 201, "create project");
  const projectId = created.body.project?.id;

  // Outsider cannot view
  const noAccess = await req(`/api/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${outsiderToken}` },
  });
  assert(noAccess.status === 403, "outsider cannot view project");

  // Search users
  const search = await req(
    `/api/users/search?q=member&excludeProjectId=${projectId}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  assert(search.status === 200, "user search works");
  const memberUser = search.body.users?.find((u) =>
    u.email.includes("member"),
  );

  // Add member by userId
  const added = await req(`/api/projects/${projectId}/members`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ userId: memberUser?.id, role: "MEMBER" }),
  });
  assert(added.status === 201, "add member by userId");

  // Member can view
  const memberView = await req(`/api/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert(memberView.status === 200, "member can view assigned project");
  assert(
    memberView.body.project?.permissions?.canManageMembers === false,
    "project member cannot manage members",
  );
  assert(
    memberView.body.project?.permissions?.canDelete === false,
    "project member cannot delete",
  );

  // Member cannot add members
  const outsiderUser = search.body.users?.find((u) =>
    u.email.includes("out"),
  );
  const memberAdd = await req(`/api/projects/${projectId}/members`, {
    method: "POST",
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({ userId: outsiderUser?.id, role: "MEMBER" }),
  });
  assert(memberAdd.status === 403, "project member cannot add members");

  // Member cannot delete project
  const memberDel = await req(`/api/projects/${projectId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert(memberDel.status === 403, "project member cannot delete project");

  // Member cannot update project
  const memberPatch = await req(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({ name: "Hacked" }),
  });
  assert(memberPatch.status === 403, "project member cannot edit project");

  // Admin can update
  const adminPatch = await req(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "Updated Name", description: "Updated" }),
  });
  assert(adminPatch.status === 200, "project admin can update");

  // Duplicate member
  const dupe = await req(`/api/projects/${projectId}/members`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ userId: memberUser?.id, role: "MEMBER" }),
  });
  assert(dupe.status === 409, "duplicate member rejected");

  // List projects — member sees only assigned
  const memberList = await req("/api/projects", {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert(
    memberList.body.projects?.some((p) => p.id === projectId),
    "member list includes assigned project",
  );

  const outsiderList = await req("/api/projects", {
    headers: { Authorization: `Bearer ${outsiderToken}` },
  });
  assert(
    !outsiderList.body.projects?.some((p) => p.id === projectId),
    "outsider list excludes unassigned project",
  );

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
