import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "phase-6-test-secret";

const { requireAuth, requireRole } = require("../dist/middleware/auth.js");

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("requireAuth returns 401 when no bearer token is provided", () => {
  const req = { headers: {} };
  const res = createResponse();
  let nextCalled = false;

  requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Authentication required" });
});

test("requireAuth attaches the decoded user for a valid bearer token", () => {
  const token = jwt.sign({ userId: "admin-user", role: "ADMIN" }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createResponse();
  let nextCalled = false;

  requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.userId, "admin-user");
  assert.equal(req.user.role, "ADMIN");
});

test("requireRole returns 403 for an authenticated non-admin user", () => {
  const middleware = requireRole("ADMIN");
  const req = { user: { userId: "promoter-1", role: "VENUE_PROMOTER" } };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Insufficient permissions" });
});

test("requireRole allows the request for the expected role", () => {
  const middleware = requireRole("ADMIN");
  const req = { user: { userId: "admin-user", role: "ADMIN" } };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, undefined);
});
