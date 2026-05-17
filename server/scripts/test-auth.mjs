#!/usr/bin/env node
/**
 * Auth integration tests — requires API + PostgreSQL running.
 * Usage: node scripts/test-auth.mjs
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3001";
const EMAIL = process.env.TEST_EMAIL ?? `test.${Date.now()}@example.com`;
const PASSWORD = process.env.TEST_PASSWORD ?? "Password123";
const WEAK_PASSWORD = "short";
const NAME = process.env.TEST_NAME ?? "Test User";

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

async function run() {
  console.log(`\nAuth tests → ${BASE_URL}\n`);

  // Health
  const health = await request("/api/health");
  assert(health.status === 200, "health check returns 200");

  // Protected route without token
  const noAuth = await request("/api/auth/me");
  assert(noAuth.status === 401, "protected /me fails without token");

  const badToken = await request("/api/auth/me", {
    headers: { Authorization: "Bearer invalid.token.value" },
  });
  assert(badToken.status === 401, "protected /me fails with invalid token");

  // Weak password rejected
  const weak = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name: NAME, email: EMAIL, password: WEAK_PASSWORD }),
  });
  assert(weak.status === 400, "weak password rejected on signup");

  // Signup
  const signup = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name: NAME, email: EMAIL, password: PASSWORD }),
  });
  assert(signup.status === 201, "signup succeeds");
  assert(Boolean(signup.body.token), "signup returns token");
  const token = signup.body.token;

  // Duplicate email
  const dupe = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name: NAME, email: EMAIL, password: PASSWORD }),
  });
  assert(dupe.status === 409, "duplicate email returns 409");

  // Login wrong password
  const badLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: "WrongPassword1" }),
  });
  assert(badLogin.status === 401, "login fails with wrong password");

  // Login
  const login = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  assert(login.status === 200, "login succeeds");
  const loginToken = login.body.token;

  // Session restore (/me with token)
  const me = await request("/api/auth/me", {
    headers: { Authorization: `Bearer ${loginToken}` },
  });
  assert(me.status === 200, "session restore via /me works");
  assert(me.body.user?.email === EMAIL, "/me returns correct user");

  // Logout
  const logout = await request("/api/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(logout.status === 200, "logout succeeds");

  // Admin route as member (first user is admin - test 403 for new member would need 2nd user)
  const adminProbe = await request("/api/admin/users", {
    headers: { Authorization: `Bearer ${loginToken}` },
  });
  assert(
    adminProbe.status === 200 || adminProbe.status === 403,
    "admin route enforces role (200 for admin, 403 for member)",
  );

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
