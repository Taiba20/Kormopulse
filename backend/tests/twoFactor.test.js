import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestEnv } from "./helpers.js";
import { currentTwoFactorToken } from "../src/utils/twoFactor.js";

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

/** Runs setup + enable for `seeker` and returns { secret, backupCodes }. */
const enableTwoFactorFor = async (seeker) => {
  const setup = await env.api.post("/api/users/2fa/setup").set(env.auth(seeker.token));
  assert.equal(setup.status, 200, JSON.stringify(setup.body));
  const { secret, qrCode, otpauthUrl } = setup.body.data;
  assert.match(qrCode, /^data:image\/png;base64,/);
  assert.match(otpauthUrl, /^otpauth:\/\/totp\//);

  const token = await currentTwoFactorToken(secret);
  const enable = await env.api.post("/api/users/2fa/enable").set(env.auth(seeker.token)).send({ token });
  assert.equal(enable.status, 200, JSON.stringify(enable.body));
  assert.equal(enable.body.data.backupCodes.length, 10);
  for (const code of enable.body.data.backupCodes) assert.match(code, /^[A-Z2-9]{5}-[A-Z2-9]{5}$/);

  return { secret, backupCodes: enable.body.data.backupCodes };
};

describe("two-factor setup", () => {
  it("returns a QR code and secret, and enabling issues 10 unique backup codes", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-setup@test.com" });
    const status0 = await env.api.get("/api/users/2fa/status").set(env.auth(seeker.token));
    assert.equal(status0.body.data.enabled, false);
    assert.equal(status0.body.data.backupCodesRemaining, 0);

    const { backupCodes } = await enableTwoFactorFor(seeker);
    assert.equal(new Set(backupCodes).size, 10);

    const status1 = await env.api.get("/api/users/2fa/status").set(env.auth(seeker.token));
    assert.equal(status1.body.data.enabled, true);
    assert.equal(status1.body.data.backupCodesRemaining, 10);
  });

  it("rejects an incorrect code when enabling, and refuses setup while already enabled", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-setup2@test.com" });
    const setup = await env.api.post("/api/users/2fa/setup").set(env.auth(seeker.token));
    const badEnable = await env.api.post("/api/users/2fa/enable").set(env.auth(seeker.token)).send({ token: "000000" });
    assert.equal(badEnable.status, 401);

    await enableTwoFactorFor(seeker);
    const secondSetup = await env.api.post("/api/users/2fa/setup").set(env.auth(seeker.token));
    assert.equal(secondSetup.status, 400);
    assert.match(secondSetup.body.message, /already enabled/i);
  });

  it("validates the enable/setup endpoints require auth and a well-formed code", async () => {
    assert.equal((await env.api.post("/api/users/2fa/setup")).status, 401);
    const seeker = await env.makeSeeker({ email: "2fa-validate@test.com" });
    await env.api.post("/api/users/2fa/setup").set(env.auth(seeker.token));
    assert.equal((await env.api.post("/api/users/2fa/enable").set(env.auth(seeker.token)).send({ token: "12" })).status, 400);
    assert.equal((await env.api.post("/api/users/2fa/enable").set(env.auth(seeker.token)).send({})).status, 400);
  });
});

describe("login with two-factor enabled", () => {
  it("withholds a session until the correct authenticator code is given", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-login@test.com", password: "secret12" });
    const { secret } = await enableTwoFactorFor(seeker);

    const login = await env.api.post("/api/users/login").send({ email: seeker.email, password: "secret12" });
    assert.equal(login.status, 200);
    assert.equal(login.body.data.twoFactorRequired, true);
    assert.ok(login.body.data.twoFactorToken);
    assert.equal(login.body.data.user, undefined); // no session granted yet
    assert.equal(login.headers["set-cookie"], undefined);

    const { twoFactorToken } = login.body.data;
    const wrongCode = await env.api.post("/api/users/2fa/login-verify").send({ twoFactorToken, code: "000000" });
    assert.equal(wrongCode.status, 401);

    const rightToken = await currentTwoFactorToken(secret);
    const verified = await env.api.post("/api/users/2fa/login-verify").send({ twoFactorToken, code: rightToken });
    assert.equal(verified.status, 200);
    assert.equal(verified.body.data.user.email, seeker.email);
    assert.ok(verified.body.data.accessToken);
    assert.match(verified.headers["set-cookie"].join(";"), /accessToken=/);
  });

  it("accepts a backup code exactly once, then rejects it on reuse", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-backup@test.com", password: "secret12" });
    const { backupCodes } = await enableTwoFactorFor(seeker);
    const code = backupCodes[0];

    const login = await env.api.post("/api/users/login").send({ email: seeker.email, password: "secret12" });
    const { twoFactorToken } = login.body.data;

    const firstUse = await env.api.post("/api/users/2fa/login-verify").send({ twoFactorToken, code });
    assert.equal(firstUse.status, 200);

    const login2 = await env.api.post("/api/users/login").send({ email: seeker.email, password: "secret12" });
    const secondUse = await env.api
      .post("/api/users/2fa/login-verify")
      .send({ twoFactorToken: login2.body.data.twoFactorToken, code });
    assert.equal(secondUse.status, 401);

    const status = await env.api.get("/api/users/2fa/status").set(env.auth(seeker.token));
    assert.equal(status.body.data.backupCodesRemaining, 9);
  });

  it("accepts a backup code case- and dash-insensitively", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-backup-case@test.com", password: "secret12" });
    const { backupCodes } = await enableTwoFactorFor(seeker);
    const relaxed = backupCodes[1].toLowerCase().replace("-", "");

    const login = await env.api.post("/api/users/login").send({ email: seeker.email, password: "secret12" });
    const verified = await env.api
      .post("/api/users/2fa/login-verify")
      .send({ twoFactorToken: login.body.data.twoFactorToken, code: relaxed });
    assert.equal(verified.status, 200);
  });

  it("rejects a forged, expired-looking, or already-consumed two-factor token", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-forged@test.com", password: "secret12" });
    const { secret } = await enableTwoFactorFor(seeker);

    const forged = await env.api
      .post("/api/users/2fa/login-verify")
      .send({ twoFactorToken: "not-a-real-token", code: "123456" });
    assert.equal(forged.status, 401);

    // A normal access token must not work as a pending-2FA token (different signing key/purpose)
    const login = await env.api.post("/api/users/login").send({ email: seeker.email, password: "secret12" });
    const rightToken = await currentTwoFactorToken(secret);
    const usingAccessToken = await env.api
      .post("/api/users/2fa/login-verify")
      .send({ twoFactorToken: seeker.token, code: rightToken });
    assert.equal(usingAccessToken.status, 401);

    // Sanity: the real pending token from this same login still works
    const real = await env.api
      .post("/api/users/2fa/login-verify")
      .send({ twoFactorToken: login.body.data.twoFactorToken, code: rightToken });
    assert.equal(real.status, 200);
  });

  it("still enforces suspension and unknown accounts at the login-verify step", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-suspend@test.com", password: "secret12" });
    const { secret } = await enableTwoFactorFor(seeker);
    const login = await env.api.post("/api/users/login").send({ email: seeker.email, password: "secret12" });

    await env.models.User.updateOne({ _id: seeker.id }, { isSuspended: true });
    const code = await currentTwoFactorToken(secret);
    const suspended = await env.api
      .post("/api/users/2fa/login-verify")
      .send({ twoFactorToken: login.body.data.twoFactorToken, code });
    assert.equal(suspended.status, 403);
  });

  it("gates Google sign-in the same way when 2FA is enabled on the account", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-google@test.com", password: "secret12" });
    const { secret } = await enableTwoFactorFor(seeker);

    setGoogleVerifier(async () => ({ email: seeker.email, name: seeker.name, sub: "google-2fa-sub", emailVerified: true }));
    const google = await env.api.post("/api/users/google").send({ credential: "fake-credential" });
    assert.equal(google.status, 200);
    assert.equal(google.body.data.twoFactorRequired, true);

    const code = await currentTwoFactorToken(secret);
    const verified = await env.api
      .post("/api/users/2fa/login-verify")
      .send({ twoFactorToken: google.body.data.twoFactorToken, code });
    assert.equal(verified.status, 200);
    assert.equal(verified.body.data.user.email, seeker.email);
  });
});

describe("disabling two-factor and regenerating backup codes", () => {
  it("requires the correct password and a valid code to disable", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-disable@test.com", password: "secret12" });
    const { secret } = await enableTwoFactorFor(seeker);

    const wrongPassword = await env.api
      .post("/api/users/2fa/disable")
      .set(env.auth(seeker.token))
      .send({ password: "wrong-pass", code: await currentTwoFactorToken(secret) });
    assert.equal(wrongPassword.status, 401);

    const wrongCode = await env.api
      .post("/api/users/2fa/disable")
      .set(env.auth(seeker.token))
      .send({ password: "secret12", code: "000000" });
    assert.equal(wrongCode.status, 401);

    const disabled = await env.api
      .post("/api/users/2fa/disable")
      .set(env.auth(seeker.token))
      .send({ password: "secret12", code: await currentTwoFactorToken(secret) });
    assert.equal(disabled.status, 200);

    const status = await env.api.get("/api/users/2fa/status").set(env.auth(seeker.token));
    assert.equal(status.body.data.enabled, false);

    // Logging in no longer asks for a second factor
    const login = await env.api.post("/api/users/login").send({ email: seeker.email, password: "secret12" });
    assert.equal(login.body.data.twoFactorRequired, undefined);
    assert.ok(login.body.data.user);
  });

  it("can be disabled with a backup code instead of a TOTP code", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-disable-backup@test.com", password: "secret12" });
    const { backupCodes } = await enableTwoFactorFor(seeker);

    const disabled = await env.api
      .post("/api/users/2fa/disable")
      .set(env.auth(seeker.token))
      .send({ password: "secret12", code: backupCodes[2] });
    assert.equal(disabled.status, 200);
  });

  it("regenerates backup codes, invalidating the old set", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-regen@test.com", password: "secret12" });
    const { secret, backupCodes: oldCodes } = await enableTwoFactorFor(seeker);

    const regenerate = await env.api
      .post("/api/users/2fa/backup-codes/regenerate")
      .set(env.auth(seeker.token))
      .send({ token: await currentTwoFactorToken(secret) });
    assert.equal(regenerate.status, 200);
    const newCodes = regenerate.body.data.backupCodes;
    assert.equal(newCodes.length, 10);
    assert.notDeepEqual(newCodes, oldCodes);

    const login = await env.api.post("/api/users/login").send({ email: seeker.email, password: "secret12" });
    const oldRejected = await env.api
      .post("/api/users/2fa/login-verify")
      .send({ twoFactorToken: login.body.data.twoFactorToken, code: oldCodes[0] });
    assert.equal(oldRejected.status, 401);

    const login2 = await env.api.post("/api/users/login").send({ email: seeker.email, password: "secret12" });
    const newAccepted = await env.api
      .post("/api/users/2fa/login-verify")
      .send({ twoFactorToken: login2.body.data.twoFactorToken, code: newCodes[0] });
    assert.equal(newAccepted.status, 200);
  });

  it("rejects disable/regenerate on an account without 2FA enabled", async () => {
    const seeker = await env.makeSeeker({ email: "2fa-none@test.com", password: "secret12" });
    assert.equal(
      (await env.api.post("/api/users/2fa/disable").set(env.auth(seeker.token)).send({ password: "secret12", code: "123456" })).status,
      400
    );
    assert.equal(
      (await env.api.post("/api/users/2fa/backup-codes/regenerate").set(env.auth(seeker.token)).send({ token: "123456" })).status,
      400
    );
  });
});
