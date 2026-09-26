import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestEnv } from "./helpers.js";

let env;
let alertService;
before(async () => {
  env = await startTestEnv();
  alertService = await import("../src/services/alert.service.js");
});
after(async () => {
  await env.stop();
});

const HOUR = 3600000;

describe("job alert CRUD", () => {
  let seeker;
  before(async () => {
    seeker = await env.makeSeeker({ email: "a-crud@test.com" });
  });

  it("requires at least one criterion and validates fields", async () => {
    const post = (body) => env.api.post("/api/alerts").set(env.auth(seeker.token)).send(body);
    assert.equal((await post({})).status, 400);
    assert.equal((await post({ keyword: "node", frequency: "hourly" })).status, 400);
    assert.equal((await post({ keyword: "node", jobType: "gig" })).status, 400);
    assert.equal((await post({ keyword: "node", minSalary: -5 })).status, 400);
  });

  it("creates, lists, updates, pauses and deletes an alert", async () => {
    const created = await env.api.post("/api/alerts").set(env.auth(seeker.token)).send({ keyword: "node", location: "Dhaka", frequency: "daily", minSalary: "30000" });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.minSalary, 30000);
    const id = created.body.data._id;

    const list = await env.api.get("/api/alerts").set(env.auth(seeker.token));
    assert.equal(list.body.data.alerts.length, 1);

    const updated = await env.api.patch(`/api/alerts/${id}`).set(env.auth(seeker.token)).send({ isActive: false, frequency: "weekly" });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.isActive, false);
    assert.equal(updated.body.data.frequency, "weekly");

    assert.equal((await env.api.delete(`/api/alerts/${id}`).set(env.auth(seeker.token))).status, 200);
    assert.equal((await env.api.delete(`/api/alerts/${id}`).set(env.auth(seeker.token))).status, 404);
  });

  it("isolates alerts between users and roles", async () => {
    const created = await env.api.post("/api/alerts").set(env.auth(seeker.token)).send({ keyword: "private" });
    const other = await env.makeSeeker({ email: "a-other@test.com" });
    assert.equal((await env.api.patch(`/api/alerts/${created.body.data._id}`).set(env.auth(other.token)).send({ isActive: false })).status, 404);
    assert.equal((await env.api.get("/api/alerts").set(env.auth(other.token))).body.data.alerts.length, 0);
    const employer = await env.makeEmployer({ email: "a-emp@test.com" });
    assert.equal((await env.api.get("/api/alerts").set(env.auth(employer.token))).status, 403);
  });

  it("limits the number of alerts per user", async () => {
    const heavy = await env.makeSeeker({ email: "a-heavy@test.com" });
    for (let i = 0; i < 10; i++) {
      assert.equal((await env.api.post("/api/alerts").set(env.auth(heavy.token)).send({ keyword: `k${i}` })).status, 201);
    }
    assert.equal((await env.api.post("/api/alerts").set(env.auth(heavy.token)).send({ keyword: "one too many" })).status, 400);
  });
});

describe("job alert delivery", () => {
  let employer;
  before(async () => {
    employer = await env.makeEmployer({ email: "d-emp@test.com", companyName: "Delta Corp" });
  });

  it("emails a digest of matching new jobs only, then does not repeat them", async () => {
    const seeker = await env.makeSeeker({ email: "d-seek@test.com", name: "Dina" });
    const alert = await env.models.JobAlert.create({
      user: seeker.id,
      keyword: "react",
      location: "Dhaka",
      frequency: "daily",
      lastCheckedAt: new Date(Date.now() - 25 * HOUR),
    });

    await env.makeJob(employer, { title: "React Engineer", skills: ["React"], location: "Dhaka" });
    await env.makeJob(employer, { title: "Senior React Lead", skills: ["React"], location: "Dhaka, BD" });
    await env.makeJob(employer, { title: "React Native Dev", skills: ["React Native"], location: "Sylhet" }); // wrong city
    await env.makeJob(employer, { title: "Accountant", skills: ["Excel"], location: "Dhaka" }); // wrong keyword
    await env.makeJob(employer, { title: "React Intern", skills: ["React"], location: "Dhaka", isActive: false }); // closed
    await env.makeJob(employer, { title: "React Expired", skills: ["React"], location: "Dhaka", applicationDeadline: new Date(Date.now() - 86400000) });

    env.clearMails();
    const result = await alertService.runDueJobAlerts();
    assert.equal(result.checked, 1);
    assert.equal(result.jobsReported, 2);

    const mail = await env.waitForMail((m) => /d-seek@test.com/.test(m.to.text) && /new jobs? for your alert/.test(m.subject));
    assert.match(mail.subject, /2 new jobs/);
    assert.match(mail.text, /React Engineer/);
    assert.match(mail.text, /Senior React Lead/);
    assert.doesNotMatch(mail.text, /Accountant|Sylhet|Intern|Expired/);
    assert.match(mail.text, /Delta Corp/);

    assert.ok(await env.waitFor(() => env.models.Notification.findOne({ user: seeker.id, type: "job_alert" })));

    // Not due again straight away, and old jobs are never re-sent
    assert.deepEqual(await alertService.runDueJobAlerts(), { checked: 0, jobsReported: 0 });
    await env.models.JobAlert.updateOne({ _id: alert._id }, { lastCheckedAt: new Date(Date.now() - 25 * HOUR) });
    // createdAt is immutable in Mongoose, so backdate through the raw collection
    await env.models.Job.collection.updateMany({}, { $set: { createdAt: new Date(Date.now() - 30 * HOUR) } });
    assert.equal((await alertService.runDueJobAlerts()).jobsReported, 0);
  });

  it("respects weekly frequency and paused alerts", async () => {
    const seeker = await env.makeSeeker({ email: "w-seek@test.com" });
    await env.models.JobAlert.create({ user: seeker.id, keyword: "weekly", frequency: "weekly", lastCheckedAt: new Date(Date.now() - 3 * 24 * HOUR) });
    await env.models.JobAlert.create({ user: seeker.id, keyword: "paused", frequency: "daily", isActive: false, lastCheckedAt: new Date(Date.now() - 48 * HOUR) });
    const result = await alertService.runDueJobAlerts();
    assert.equal(result.checked, 0);
  });

  it("sends instant alerts the moment a matching job is posted", async () => {
    const seeker = await env.makeSeeker({ email: "n-seek@test.com", name: "Nadia" });
    await env.models.JobAlert.create({ user: seeker.id, keyword: "golang", frequency: "instant" });
    await env.models.JobAlert.create({ user: seeker.id, keyword: "cobol", frequency: "instant" });
    env.clearMails();

    const res = await env.api
      .post("/api/jobs/jobs")
      .set(env.auth(employer.token))
      .send({
        title: "Golang Backend Engineer",
        description: "<p>Build services</p>",
        skills: ["Golang"],
        experience: { min: 1, max: 3 },
        salary: { min: 50000, max: 90000, currency: "BDT" },
        jobType: "full-time",
        workMode: "remote",
        location: "Dhaka",
        category: "software-development",
      });
    assert.equal(res.status, 201, JSON.stringify(res.body));

    const mail = await env.waitForMail((m) => /n-seek@test.com/.test(m.to.text) && /Golang Backend Engineer/.test(m.text));
    assert.match(mail.subject, /1 new job/);
    await new Promise((r) => setTimeout(r, 300));
    assert.equal((await env.mails()).filter((m) => /n-seek@test.com/.test(m.to.text) && /new job/.test(m.subject)).length, 1); // "cobol" did not fire
  });

  it("lets a user preview an alert with the test endpoint", async () => {
    const seeker = await env.makeSeeker({ email: "t-seek@test.com" });
    await env.makeJob(employer, { title: "Kotlin Developer", skills: ["Kotlin"] });
    const created = await env.api.post("/api/alerts").set(env.auth(seeker.token)).send({ keyword: "kotlin" });
    env.clearMails();
    const res = await env.api.post(`/api/alerts/${created.body.data._id}/test`).set(env.auth(seeker.token));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.jobsFound, 1);
    await env.waitForMail((m) => /t-seek@test.com/.test(m.to.text) && /Kotlin Developer/.test(m.text));
  });
});
