import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestEnv } from "./helpers.js";
import { computeMatch, parseYears, normalizeSkill } from "../src/utils/matchScore.js";

let env;
before(async () => {
  env = await startTestEnv();
});
after(async () => {
  await env.stop();
});

describe("match score engine (unit)", () => {
  it("normalises skill spellings", () => {
    assert.equal(normalizeSkill("Node.js"), normalizeSkill("nodejs"));
    assert.equal(normalizeSkill("  React.JS "), normalizeSkill("react"));
    assert.equal(normalizeSkill("C++"), "cpp");
  });

  it("parses years from several formats", () => {
    assert.equal(parseYears("3"), 3);
    assert.equal(parseYears("3-5"), 4);
    assert.equal(parseYears("5+"), 5);
    assert.equal(parseYears(""), 0);
    assert.equal(parseYears(undefined), 0);
    assert.equal(parseYears("2.5 years"), 2.5);
  });

  it("gives a perfect skill+experience fit a high score with no missing skills", () => {
    const m = computeMatch(
      { skills: ["Node.js", "MongoDB"], yearsOfExperience: "2", location: "Dhaka", primaryRole: "Backend Developer", jobPreferences: { types: ["full-time"], locations: ["Dhaka"] } },
      { skills: ["nodejs", "mongodb"], experience: { min: 1, max: 4 }, location: "Dhaka, Bangladesh", workMode: "onsite", jobType: "full-time", title: "Backend Developer" }
    );
    assert.ok(m.score >= 90, `score was ${m.score}`);
    assert.deepEqual(m.missingSkills, []);
    assert.equal(m.matchedSkills.length, 2);
    assert.equal(m.label, "Excellent match");
  });

  it("scores a poor fit low and lists the missing skills", () => {
    const m = computeMatch(
      { skills: ["Photoshop"], yearsOfExperience: "0", location: "Chittagong" },
      { skills: ["Java", "Spring"], experience: { min: 5, max: 8 }, location: "Dhaka", workMode: "onsite", jobType: "full-time", title: "Senior Java Engineer" }
    );
    assert.ok(m.score < 40, `score was ${m.score}`);
    assert.deepEqual(m.missingSkills, ["Java", "Spring"]);
  });

  it("does not penalise location for remote jobs and stays within 0..100", () => {
    const remote = computeMatch({ skills: ["Go"], yearsOfExperience: "3", location: "Sylhet" }, { skills: ["Go"], experience: { min: 1, max: 5 }, location: "Dhaka", workMode: "remote", jobType: "full-time", title: "Go Dev" });
    const onsite = computeMatch({ skills: ["Go"], yearsOfExperience: "3", location: "Sylhet" }, { skills: ["Go"], experience: { min: 1, max: 5 }, location: "Dhaka", workMode: "onsite", jobType: "full-time", title: "Go Dev" });
    assert.ok(remote.score > onsite.score);
    for (const m of [remote, onsite, computeMatch({}, {})]) assert.ok(m.score >= 0 && m.score <= 100);
  });
});

describe("applications, notifications and emails", () => {
  it("creates notifications and emails for both sides when a candidate applies", async () => {
    const employer = await env.makeEmployer({ email: "p-emp1@test.com", name: "Erin Employer" });
    const seeker = await env.makeSeeker({ email: "p-seek1@test.com", name: "Sam Seeker", skills: ["Node.js"] });
    const job = await env.makeJob(employer, { title: "API Engineer" });
    env.clearMails();

    await env.applyTo(seeker, job);

    const employerNotes = await env.waitFor(async () => {
      const n = await env.models.Notification.find({ user: employer.id, type: "application_received" });
      return n.length ? n : null;
    });
    assert.match(employerNotes[0].message, /Sam Seeker applied for API Engineer/);
    assert.equal(employerNotes[0].link, `/pipeline/${job._id}`);

    const seekerNote = await env.waitFor(() => env.models.Notification.findOne({ user: seeker.id, title: "Application submitted" }));
    assert.ok(seekerNote);

    await env.waitForMail((m) => /p-seek1@test.com/.test(m.to.text) && /Application submitted/.test(m.subject));
    await env.waitForMail((m) => /p-emp1@test.com/.test(m.to.text) && /New application/.test(m.subject));

    const stored = await env.models.Application.findOne({ job: job._id, applicant: seeker.id });
    assert.equal(stored.statusHistory.length, 1);
    assert.equal(stored.statusHistory[0].status, "pending");
  });

  it("exposes notifications with unread counts and lets the user mark them read", async () => {
    const employer = await env.makeEmployer({ email: "p-emp2@test.com" });
    const seeker = await env.makeSeeker({ email: "p-seek2@test.com" });
    await env.applyTo(seeker, await env.makeJob(employer));
    await env.waitFor(() => env.models.Notification.findOne({ user: employer.id }));

    const list = await env.api.get("/api/notifications").set(env.auth(employer.token));
    assert.equal(list.status, 200);
    assert.ok(list.body.data.unreadCount >= 1);
    const first = list.body.data.notifications[0];

    const count = await env.api.get("/api/notifications/unread-count").set(env.auth(employer.token));
    assert.equal(count.body.data.unreadCount, list.body.data.unreadCount);

    // Another user cannot touch it
    const stranger = await env.signup({ email: "p-stranger@test.com" });
    assert.equal((await env.api.patch(`/api/notifications/${first._id}/read`).set(env.auth(stranger.token))).status, 404);

    assert.equal((await env.api.patch(`/api/notifications/${first._id}/read`).set(env.auth(employer.token))).status, 200);
    assert.equal((await env.api.patch("/api/notifications/read-all").set(env.auth(employer.token))).status, 200);
    const after = await env.api.get("/api/notifications/unread-count").set(env.auth(employer.token));
    assert.equal(after.body.data.unreadCount, 0);

    assert.equal((await env.api.delete(`/api/notifications/${first._id}`).set(env.auth(employer.token))).status, 200);
    assert.equal((await env.api.get("/api/notifications").query({ limit: 500 }).set(env.auth(employer.token))).status, 400);
  });
});

describe("kanban pipeline", () => {
  let employer, seekerA, seekerB, job, appA;

  before(async () => {
    employer = await env.makeEmployer({ email: "k-emp@test.com" });
    seekerA = await env.makeSeeker({ email: "k-a@test.com", name: "Ayesha A", skills: ["Node.js", "MongoDB"], yearsOfExperience: "2", primaryRole: "Backend Developer" });
    seekerB = await env.makeSeeker({ email: "k-b@test.com", name: "Bilal B", skills: ["Photoshop"], yearsOfExperience: "0" });
    job = await env.makeJob(employer);
    appA = await env.applyTo(seekerA, job);
    await env.applyTo(seekerB, job);
  });

  it("returns applications grouped by stage with match scores", async () => {
    const res = await env.api.get(`/api/applications/pipeline/${job._id}`).set(env.auth(employer.token));
    assert.equal(res.status, 200);
    const { columns, counts, total } = res.body.data;
    assert.equal(total, 2);
    assert.equal(counts.pending, 2);
    for (const stage of ["pending", "reviewed", "shortlisted", "interview", "hired", "rejected"]) {
      assert.ok(Array.isArray(columns[stage]), stage);
    }
    const a = columns.pending.find((c) => c.applicant.name === "Ayesha A");
    const b = columns.pending.find((c) => c.applicant.name === "Bilal B");
    assert.ok(a.match.score > b.match.score, `${a.match.score} vs ${b.match.score}`);
    assert.deepEqual(a.match.missingSkills, []);
    assert.deepEqual(b.match.matchedSkills, []);
  });

  it("moves a card, records history, notifies and emails the candidate", async () => {
    env.clearMails();
    const res = await env.api
      .patch(`/api/applications/${appA._id}/status`)
      .set(env.auth(employer.token))
      .send({ status: "shortlisted", note: "Strong portfolio" });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "shortlisted");

    const note = await env.waitFor(() => env.models.Notification.findOne({ user: seekerA.id, title: "You have been shortlisted" }));
    assert.equal(note.type, "application_status");
    await env.waitForMail((m) => /k-a@test.com/.test(m.to.text) && /shortlisted/i.test(m.subject));

    const stored = await env.models.Application.findById(appA._id);
    assert.deepEqual(stored.statusHistory.map((h) => h.status), ["pending", "shortlisted"]);
    assert.equal(stored.statusHistory[1].note, "Strong portfolio");

    // Legacy embedded copy on the job stays in sync
    const legacy = (await env.models.Job.findById(job._id)).applicants.find((x) => String(x.user) === seekerA.id);
    assert.equal(legacy.status, "interviewed");
  });

  it("shows the candidate a timeline of their application", async () => {
    const res = await env.api.get("/api/applications/mine").set(env.auth(seekerA.token));
    assert.equal(res.status, 200);
    const mine = res.body.data.find((a) => a._id === String(appA._id));
    assert.equal(mine.status, "shortlisted");
    assert.deepEqual(mine.timeline.map((t) => t.status), ["pending", "shortlisted"]);
    assert.equal(mine.job.title, "Backend Developer");
    assert.equal(mine.job.company.companyName, "Acme Ltd");
  });

  it("keeps a hired application (history preserved) and sends the hire email", async () => {
    env.clearMails();
    const res = await env.api
      .post("/api/jobs/hire-candidate")
      .set(env.auth(employer.token))
      .send({ jobId: String(job._id), applicantId: seekerA.id });
    assert.equal(res.status, 200);
    const stored = await env.models.Application.findById(appA._id);
    assert.equal(stored.status, "hired");
    await env.waitForMail((m) => /k-a@test.com/.test(m.to.text) && /selected/i.test(m.subject));
  });

  it("supports rejecting via the pipeline and emails politely", async () => {
    env.clearMails();
    const bApp = await env.models.Application.findOne({ applicant: seekerB.id });
    const res = await env.api.patch(`/api/applications/${bApp._id}/status`).set(env.auth(employer.token)).send({ status: "rejected" });
    assert.equal(res.status, 200);
    await env.waitForMail((m) => /k-b@test.com/.test(m.to.text) && /Update on your application/.test(m.subject));
  });

  it("is a no-op (no duplicate history/emails) when the status does not change", async () => {
    const before = await env.models.Application.findById(appA._id);
    await env.api.patch(`/api/applications/${appA._id}/status`).set(env.auth(employer.token)).send({ status: "hired" });
    const after = await env.models.Application.findById(appA._id);
    assert.equal(after.statusHistory.length, before.statusHistory.length);
  });

  it("enforces ownership and roles", async () => {
    const otherEmployer = await env.makeEmployer({ email: "k-other@test.com" });
    assert.equal((await env.api.get(`/api/applications/pipeline/${job._id}`).set(env.auth(otherEmployer.token))).status, 403);
    assert.equal((await env.api.patch(`/api/applications/${appA._id}/status`).set(env.auth(otherEmployer.token)).send({ status: "rejected" })).status, 403);
    assert.equal((await env.api.get(`/api/applications/pipeline/${job._id}`).set(env.auth(seekerA.token))).status, 403);
    assert.equal((await env.api.get("/api/applications/mine").set(env.auth(employer.token))).status, 403);
    assert.equal((await env.api.patch(`/api/applications/${appA._id}/status`).set(env.auth(employer.token)).send({ status: "flying" })).status, 400);
    assert.equal((await env.api.get("/api/applications/pipeline/not-an-id").set(env.auth(employer.token))).status, 400);
  });
});

describe("match score API for job seekers", () => {
  it("returns scores for a batch of job ids and a detailed breakdown", async () => {
    const employer = await env.makeEmployer({ email: "m-emp@test.com" });
    const seeker = await env.makeSeeker({ email: "m-seek@test.com", skills: ["Node.js"], yearsOfExperience: "2", location: "Dhaka" });
    const jobA = await env.makeJob(employer, { title: "Node Dev", skills: ["Node.js"] });
    const jobB = await env.makeJob(employer, { title: "Rust Dev", skills: ["Rust", "C++"], experience: { min: 6, max: 9 }, location: "Sylhet" });

    const res = await env.api.post("/api/jobs/match-scores").set(env.auth(seeker.token)).send({ jobIds: [String(jobA._id), String(jobB._id)] });
    assert.equal(res.status, 200);
    const { scores } = res.body.data;
    assert.ok(scores[jobA._id].score > scores[jobB._id].score);
    assert.deepEqual(scores[jobB._id].missingSkills, ["Rust", "C++"]);

    const one = await env.api.get(`/api/jobs/match/${jobA._id}`).set(env.auth(seeker.token));
    assert.equal(one.status, 200);
    assert.ok(one.body.data.breakdown.skills > 0);

    assert.equal((await env.api.post("/api/jobs/match-scores").set(env.auth(seeker.token)).send({ jobIds: [] })).status, 400);
    assert.equal((await env.api.post("/api/jobs/match-scores").set(env.auth(employer.token)).send({ jobIds: [String(jobA._id)] })).status, 403);
  });
});
