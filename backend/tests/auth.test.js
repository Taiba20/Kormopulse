import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import { startTestEnv } from "./helpers.js";

let env;
let setGoogleVerifier;

before(async () => {
  env = await startTestEnv();
  ({ setGoogleVerifier } = await import("../src/utils/google.service.js"));
});
after(async () => {
  setGoogleVerifier(null);
  await env.stop();
});

const codeFrom = (mail) => mail.text.match(/\b(\d{6})\b/)[1];

describe("signup validation and security", () => {
  it("rejects an admin role at signup (privilege escalation)", async () => {
    const res = await env.api
      .post("/api/users/signup")
      .send({ name: "Mallory", email: "mallory@test.com", password: "secret12", role: "admin" });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /role/i);
    assert.equal(await env.models.User.countDocuments({ email: "mallory@test.com" }), 0);
  });

  it("rejects an invalid email, short password and missing name", async () => {
    const bad = [
      { name: "A B", email: "not-an-email", password: "secret12", role: "jobSeeker" },
      { name: "A B", email: "ok@test.com", password: "123", role: "jobSeeker" },
      { email: "ok@test.com", password: "secret12", role: "jobSeeker" },
    ];
    for (const body of bad) {
      const res = await env.api.post("/api/users/signup").send(body);
      assert.equal(res.status, 400, JSON.stringify(body));
    }
  });

  it("rejects duplicate emails with 409", async () => {
    const a = await env.signup({ email: "dupe@test.com" });
    const res = await env.api
      .post("/api/users/signup")
      .send({ name: "Other", email: a.email.toUpperCase(), password: "secret12", role: "jobSeeker" });
    assert.equal(res.status, 409);
  });

  it("returns proper HTTP status codes for auth failures", async () => {
    await env.signup({ email: "codes@test.com" });
    assert.equal((await env.api.post("/api/users/login").send({ email: "codes@test.com", password: "wrong-pass" })).status, 401);
    assert.equal((await env.api.post("/api/users/login").send({ email: "ghost@test.com", password: "secret12" })).status, 404);
    assert.equal((await env.api.get("/api/users/current-user")).status, 401);
    assert.equal((await env.api.get("/api/users/current-user").set(env.auth("garbage"))).status, 401);
    assert.equal((await env.api.get("/api/no-such-route")).status, 404);
    const malformed = await env.api.post("/api/users/login").set("Content-Type", "application/json").send("{bad json");
    assert.equal(malformed.status, 400);
  });

  it("sends security headers", async () => {
    const res = await env.api.get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.headers["x-content-type-options"], "nosniff");
    assert.ok(res.headers["x-frame-options"] || res.headers["content-security-policy"]);
    assert.equal(res.headers["x-powered-by"], undefined);
  });
});

describe("email verification", () => {
  it("emails a code on signup and verifies with it", async () => {
    env.clearMails();
    const user = await env.signup({ email: "verify@test.com" });
    assert.equal(user.user.emailVerified, false);

    const mail = await env.waitForMail((m) => /verify@test.com/.test(m.to.text) && /Verify/i.test(m.subject));
    const code = codeFrom(mail);

    const wrong = await env.api.post("/api/users/verify-email").set(env.auth(user.token)).send({ code: code === "000000" ? "111111" : "000000" });
    assert.equal(wrong.status, 400);

    const ok = await env.api.post("/api/users/verify-email").set(env.auth(user.token)).send({ code });
    assert.equal(ok.status, 200);
    const me = await env.api.get("/api/users/current-user").set(env.auth(user.token));
    assert.equal(me.body.data.user.emailVerified, true);

    const reuse = await env.api.post("/api/users/verify-email").set(env.auth(user.token)).send({ code });
    assert.equal(reuse.status, 200); // already verified is a harmless no-op
  });

  it("locks the code after too many wrong attempts", async () => {
    env.clearMails();
    const user = await env.signup({ email: "lock@test.com" });
    const code = codeFrom(await env.waitForMail((m) => /lock@test.com/.test(m.to.text)));
    const wrongCode = code === "123456" ? "654321" : "123456";
    for (let i = 0; i < 5; i++) {
      await env.api.post("/api/users/verify-email").set(env.auth(user.token)).send({ code: wrongCode });
    }
    const late = await env.api.post("/api/users/verify-email").set(env.auth(user.token)).send({ code });
    assert.equal(late.status, 400);
  });

  it("enforces a resend cooldown", async () => {
    const user = await env.signup({ email: "cooldown@test.com" });
    await env.waitFor(async () => (await env.models.User.findOne({ email: "cooldown@test.com" }).select("+emailVerificationExpires")).emailVerificationExpires);
    const res = await env.api.post("/api/users/resend-verification").set(env.auth(user.token));
    assert.equal(res.status, 429);
  });

  it("blocks unverified users from applying only when REQUIRE_EMAIL_VERIFICATION is on", async () => {
    const employer = await env.makeEmployer({ email: "gate-emp@test.com" });
    const job = await env.makeJob(employer);
    const seeker = await env.signup({ email: "gate-seeker@test.com" });

    process.env.REQUIRE_EMAIL_VERIFICATION = "true";
    try {
      const blocked = await env.api.post(`/api/jobs/apply/${job._id}`).set(env.auth(seeker.token)).send({});
      assert.equal(blocked.status, 403);
      assert.match(blocked.body.message, /verify/i);
    } finally {
      process.env.REQUIRE_EMAIL_VERIFICATION = "";
    }
    const allowed = await env.api.post(`/api/jobs/apply/${job._id}`).set(env.auth(seeker.token)).send({});
    assert.equal(allowed.status, 200);
  });

  it("treats legacy accounts (no emailVerified field) as verified", async () => {
    const employer = await env.makeEmployer({ email: "legacy-emp@test.com" });
    const job = await env.makeJob(employer);
    const seeker = await env.signup({ email: "legacy@test.com" });
    await env.models.User.updateOne({ _id: seeker.id }, { $unset: { emailVerified: 1 } });
    process.env.REQUIRE_EMAIL_VERIFICATION = "true";
    try {
      const res = await env.api.post(`/api/jobs/apply/${job._id}`).set(env.auth(seeker.token)).send({});
      assert.equal(res.status, 200);
    } finally {
      process.env.REQUIRE_EMAIL_VERIFICATION = "";
    }
  });
});

describe("password reset by emailed code", () => {
  it("completes the full flow and invalidates the old password and code", async () => {
    const user = await env.signup({ email: "reset@test.com" });
    env.clearMails();

    const req1 = await env.api.post("/api/users/forgot-password").send({ email: "reset@test.com" });
    assert.equal(req1.status, 200);
    const code = codeFrom(await env.waitForMail((m) => /reset@test.com/.test(m.to.text) && /reset/i.test(m.subject)));

    const mismatch = await env.api.post("/api/users/reset-password").send({ email: "reset@test.com", code, password: "newpass1", confirmPassword: "different" });
    assert.equal(mismatch.status, 400);

    const ok = await env.api.post("/api/users/reset-password").send({ email: "reset@test.com", code, password: "newpass1", confirmPassword: "newpass1" });
    assert.equal(ok.status, 200);

    assert.equal((await env.api.post("/api/users/login").send({ email: user.email, password: "secret12" })).status, 401);
    assert.equal((await env.api.post("/api/users/login").send({ email: user.email, password: "newpass1" })).status, 200);

    const reuse = await env.api.post("/api/users/reset-password").send({ email: "reset@test.com", code, password: "another1", confirmPassword: "another1" });
    assert.equal(reuse.status, 400);
  });

  it("does not reveal whether an email is registered", async () => {
    const known = await env.api.post("/api/users/forgot-password").send({ email: "reset@test.com" });
    const unknown = await env.api.post("/api/users/forgot-password").send({ email: "nobody@test.com" });
    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.equal(known.body.message, unknown.body.message);
  });
});

describe("google sign-in", () => {
  it("asks a new Google user to choose a role, then creates a verified account", async () => {
    setGoogleVerifier(async () => ({ sub: "g-1", email: "gnew@test.com", emailVerified: true, name: "G New", picture: "x" }));

    const first = await env.api.post("/api/users/google").send({ credential: "fake-token-value" });
    assert.equal(first.status, 200);
    assert.equal(first.body.data.needsRole, true);
    assert.equal(await env.models.User.countDocuments({ email: "gnew@test.com" }), 0);

    const second = await env.api.post("/api/users/google").send({ credential: "fake-token-value", role: "employer" });
    assert.equal(second.status, 200);
    assert.equal(second.body.data.user.role, "employer");
    assert.equal(second.body.data.user.emailVerified, true);
    assert.ok(second.body.data.accessToken);

    const again = await env.api.post("/api/users/google").send({ credential: "fake-token-value" });
    assert.equal(again.body.data.user.email, "gnew@test.com");
  });

  it("links to an existing account and marks it verified", async () => {
    const existing = await env.signup({ email: "glink@test.com" });
    setGoogleVerifier(async () => ({ sub: "g-2", email: "glink@test.com", emailVerified: true, name: "Linked" }));
    const res = await env.api.post("/api/users/google").send({ credential: "fake-token-value" });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user._id, existing.id);
    assert.equal(res.body.data.user.emailVerified, true);
  });

  it("rejects unverified Google emails, bad tokens and cannot create admins", async () => {
    setGoogleVerifier(async () => ({ sub: "g-3", email: "gbad@test.com", emailVerified: false, name: "Bad" }));
    assert.equal((await env.api.post("/api/users/google").send({ credential: "fake-token-value" })).status, 401);

    setGoogleVerifier(async () => {
      throw new Error("Invalid token signature");
    });
    assert.equal((await env.api.post("/api/users/google").send({ credential: "fake-token-value" })).status, 401);

    setGoogleVerifier(async () => ({ sub: "g-4", email: "gadmin@test.com", emailVerified: true, name: "Admin?" }));
    const res = await env.api.post("/api/users/google").send({ credential: "fake-token-value", role: "admin" });
    assert.equal(res.status, 400);
  });

  it("fails cleanly when Google sign-in is not configured", async () => {
    setGoogleVerifier(null);
    process.env.GOOGLE_CLIENT_ID = "";
    const res = await env.api.post("/api/users/google").send({ credential: "fake-token-value" });
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    assert.equal(res.status, 401);
    assert.match(res.body.message, /not configured/i);
  });
});

describe("suspended accounts", () => {
  it("cannot log in and existing tokens stop working", async () => {
    const user = await env.signup({ email: "susp@test.com" });
    await env.models.User.updateOne({ _id: user.id }, { isSuspended: true });
    const login = await env.api.post("/api/users/login").send({ email: user.email, password: user.password });
    assert.equal(login.status, 403);
    const me = await env.api.get("/api/users/current-user").set(env.auth(user.token));
    assert.equal(me.status, 403);
  });
});

describe("rate limiting", () => {
  it("returns 429 with a helpful message once the limit is exceeded", async () => {
    const { createLimiter } = await import("../src/middlewares/rateLimit.middleware.js");
    const { config } = await import("../src/config/index.js");

    assert.equal(config.rateLimitDisabled, true); // off by default under test so other suites are not throttled

    process.env.RATE_LIMIT_DISABLED = "false";
    try {
      assert.equal(config.rateLimitDisabled, false);
      const app = express();
      app.use(createLimiter({ windowMs: 60000, limit: 2, message: "slow down" }));
      app.get("/x", (_q, res) => res.json({ ok: true }));
      const agent = request(app);
      assert.equal((await agent.get("/x")).status, 200);
      assert.equal((await agent.get("/x")).status, 200);
      const limited = await agent.get("/x");
      assert.equal(limited.status, 429);
      assert.equal(limited.body.message, "slow down");
    } finally {
      delete process.env.RATE_LIMIT_DISABLED;
    }
  });
});
