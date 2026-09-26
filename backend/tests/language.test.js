import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestEnv } from "./helpers.js";
import { tr, normalizeLanguage } from "../src/utils/i18n.js";

let env;
before(async () => {
  env = await startTestEnv();
});
after(async () => {
  await env.stop();
});

const BANGLA = /[ঀ-৿]/;

describe("translation helper (unit)", () => {
  it("fills placeholders, escapes HTML on request and falls back to English", () => {
    assert.equal(tr("en", "common.greeting", { name: "Sam" }), "Hi Sam,");
    assert.equal(tr("bn", "common.greeting", { name: "রিনা" }), "প্রিয় রিনা,");
    assert.equal(tr("en", "common.greeting", { name: "<b>x</b>" }, { html: true }), "Hi &lt;b&gt;x&lt;/b&gt;,");
    assert.equal(tr("xx", "common.greeting", { name: "Sam" }), "Hi Sam,");
    assert.equal(tr("bn", "does.not.exist"), "does.not.exist");
    assert.equal(normalizeLanguage("bn"), "bn");
    assert.equal(normalizeLanguage("fr"), "en");
    assert.equal(normalizeLanguage(undefined), "en");
  });

  it("has a Bangla version of every English mail and notification text", () => {
    const flatten = (obj, prefix = "") =>
      Object.entries(obj).flatMap(([k, v]) => (v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
    const keys = [...flatten({ mail: sample("mail"), notify: sample("notify") })];
    assert.ok(keys.length > 40);
    // "{jobTitle}: {when}" is placeholders only, so it has nothing to translate
    for (const key of keys.filter((k) => k !== "notify.interviewConfirmed.message")) {
      assert.match(tr("bn", key), BANGLA, `bn is missing text for ${key}`);
    }
  });
});

// Reads the English dictionary through tr() by probing every known key group
function sample(group) {
  const groups = {
    mail: {
      passwordReset: ["subject", "title", "text", "html", "htmlIgnore"],
      verifyEmail: ["subject", "title", "text", "html"],
      applicationReceived: ["subject", "title", "text", "html"],
      newApplication: ["subject", "title", "text", "html"],
      shortlisted: ["subject", "title", "text", "html"],
      hired: ["subject", "title", "text", "html"],
      rejected: ["subject", "title", "text", "html", "button"],
      interviewProposed: ["subject", "title", "text", "html", "button"],
      interviewConfirmed: ["subject", "title", "text", "html", "htmlAttached"],
      interviewCancelled: ["subject", "title", "text", "html"],
      interviewDeclined: ["subject", "title", "text", "html", "reasonLine", "reasonHtml", "button"],
      alertDigest: ["subject_one", "subject_other", "text", "title", "intro", "button"],
    },
    notify: {
      emailVerified: ["title", "message"],
      accountRestored: ["title", "message"],
      jobDeactivated: ["title", "message"],
      applicationSubmitted: ["title", "message"],
      applicationReceived: ["title", "message"],
      newMessage: ["title"],
      review: ["title", "message"],
      interviewInvite: ["title", "message"],
      interviewConfirmed: ["title", "message"],
      interviewDeclined: ["title", "message"],
      interviewCancelled: ["title", "message"],
      alertDigest_one: ["title"],
      alertDigest_other: ["title"],
      alertInstant: ["title", "message"],
    },
  }[group];
  return Object.fromEntries(Object.entries(groups).map(([name, fields]) => [name, Object.fromEntries(fields.map((f) => [f, ""]))]));
}

describe("language preference", () => {
  it("defaults to English, can be chosen at signup and changed later", async () => {
    const english = await env.signup({ email: "lang-en@test.com" });
    assert.equal((await env.models.User.findById(english.id)).language, "en");

    const res = await env.api
      .post("/api/users/signup")
      .send({ name: "Bangla User", email: "lang-bn@test.com", password: "secret12", role: "jobSeeker", language: "bn" });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.language, "bn");

    const patch = await env.api.patch("/api/users/language").set(env.auth(english.token)).send({ language: "bn" });
    assert.equal(patch.status, 200);
    assert.equal((await env.models.User.findById(english.id)).language, "bn");
  });

  it("rejects unknown languages and anonymous requests", async () => {
    const user = await env.signup({ email: "lang-bad@test.com" });
    assert.equal((await env.api.patch("/api/users/language").set(env.auth(user.token)).send({ language: "fr" })).status, 400);
    assert.equal((await env.api.patch("/api/users/language").send({ language: "bn" })).status, 401);
    assert.equal(
      (await env.api.post("/api/users/signup").send({ name: "Bad Lang", email: "lang-bad2@test.com", password: "secret12", role: "jobSeeker", language: "de" })).status,
      400
    );
  });
});

describe("emails and notifications follow the recipient's language", () => {
  it("sends the signup verification email in Bangla to a Bangla user, English otherwise", async () => {
    await env.api
      .post("/api/users/signup")
      .send({ name: "Rina Akter", email: "mail-bn@test.com", password: "secret12", role: "jobSeeker", language: "bn" });
    const bnMail = await env.waitForMail((m) => /mail-bn@test.com/.test(m.to.text));
    assert.match(bnMail.subject, BANGLA);
    assert.match(bnMail.text, /প্রিয় Rina Akter,/);
    assert.match(bnMail.html, /\d{6}/); // the code is still there

    await env.signup({ email: "mail-en@test.com", name: "Eve English" });
    const enMail = await env.waitForMail((m) => /mail-en@test.com/.test(m.to.text));
    assert.match(enMail.subject, /Verify your Kormopulse email/);
    assert.match(enMail.text, /Hi Eve English,/);
  });

  it("sends the password reset code in the account's language", async () => {
    await env.signup({ email: "reset-bn@test.com", name: "Reset Bn" });
    await env.models.User.updateOne({ email: "reset-bn@test.com" }, { language: "bn" });
    env.clearMails();
    await env.api.post("/api/users/forgot-password").send({ email: "reset-bn@test.com" });
    const mail = await env.waitForMail((m) => /reset-bn@test.com/.test(m.to.text) && /রিসেট/.test(m.subject));
    assert.match(mail.subject, /পাসওয়ার্ড রিসেট কোড/);
    assert.match(mail.text, /\b\d{6}\b/);
  });

  it("notifies and emails a Bangla candidate about their application in Bangla", async () => {
    const employer = await env.makeEmployer({ email: "lang-emp@test.com", name: "Lang Employer", companyName: "Bangla Corp" });
    const seeker = await env.makeSeeker({ email: "lang-seek@test.com", name: "Sumi Seeker", skills: ["Node.js"] });
    await env.models.User.updateOne({ _id: seeker.id }, { language: "bn" });
    const job = await env.makeJob(employer, { title: "API Engineer" });
    env.clearMails();

    const application = await env.applyTo(seeker, job);
    const submitted = await env.waitFor(() => env.models.Notification.findOne({ user: seeker.id, type: "application_status" }));
    assert.match(submitted.title, BANGLA);
    assert.match(submitted.message, /Bangla Corp/);
    assert.match(submitted.message, /API Engineer/);
    await env.waitForMail((m) => /lang-seek@test.com/.test(m.to.text) && BANGLA.test(m.subject));

    // The employer never chose a language, so their side stays English
    const employerNote = await env.waitFor(() => env.models.Notification.findOne({ user: employer.id, type: "application_received" }));
    assert.match(employerNote.title, /New application received/);

    env.clearMails();
    const status = await env.api
      .patch(`/api/applications/${application._id}/status`)
      .set(env.auth(employer.token))
      .send({ status: "shortlisted" });
    assert.equal(status.status, 200);
    const shortlisted = await env.waitFor(() => env.models.Notification.findOne({ user: seeker.id, title: /শর্টলিস্টেড/ }));
    assert.match(shortlisted.message, /Bangla Corp/);
    const mail = await env.waitForMail((m) => /lang-seek@test.com/.test(m.to.text) && /শর্টলিস্টেড/.test(m.subject));
    assert.match(mail.html, /Bangla Corp/);
    assert.match(mail.html, /Noto Sans Bengali/); // the template names a Bengali-capable font
  });

  it("keeps user-provided text out of the markup in Bangla emails too", async () => {
    const employer = await env.makeEmployer({ email: "lang-emp2@test.com", name: "Emp Two", companyName: "<i>Evil</i> Ltd" });
    const seeker = await env.makeSeeker({ email: "lang-seek2@test.com", name: "Seeker Two" });
    await env.models.User.updateOne({ _id: seeker.id }, { language: "bn" });
    const job = await env.makeJob(employer, { title: "Role <script>alert(1)</script>" });
    env.clearMails();
    await env.applyTo(seeker, job);
    const mail = await env.waitForMail((m) => /lang-seek2@test.com/.test(m.to.text) && /আবেদন জমা/.test(m.subject));
    assert.doesNotMatch(mail.html, /<script>/);
    assert.doesNotMatch(mail.html, /<i>Evil<\/i>/);
    assert.match(mail.html, /&lt;script&gt;/);
  });

  it("writes the job alert digest and notification in Bangla", async () => {
    const employer = await env.makeEmployer({ email: "lang-emp3@test.com", companyName: "Digest Corp" });
    const seeker = await env.makeSeeker({ email: "lang-seek3@test.com", name: "Digest Seeker" });
    await env.models.User.updateOne({ _id: seeker.id }, { language: "bn" });
    const create = await env.api
      .post("/api/alerts")
      .set(env.auth(seeker.token))
      .send({ name: "Elixir jobs", keyword: "elixir", frequency: "instant" });
    assert.equal(create.status, 201);
    env.clearMails();

    const job = await env.makeJob(employer, { title: "Elixir Engineer" });
    const { notifyInstantAlerts } = await import("../src/services/alert.service.js");
    await notifyInstantAlerts(job);

    const note = await env.waitFor(() => env.models.Notification.findOne({ user: seeker.id, type: "job_alert" }));
    assert.match(note.title, BANGLA);
    assert.match(note.title, /Elixir jobs/);
    assert.match(note.message, /Elixir Engineer/);
    await env.waitForMail((m) => /lang-seek3@test.com/.test(m.to.text) && BANGLA.test(m.subject));
  });
});
